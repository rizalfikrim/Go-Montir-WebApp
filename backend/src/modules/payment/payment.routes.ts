import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/authenticate';
import { AppError } from '@/middlewares/errorHandler';
import prisma from '@/config/database';
import { env } from '@/config/env';
import { Role } from '@prisma/client';
import midtransClient from 'midtrans-client';
import crypto from 'crypto';

const router = Router();

// Initialize Midtrans Snap client
const snap = new (midtransClient as any).Snap({
  isProduction: env.MIDTRANS_IS_PRODUCTION,
  serverKey: env.MIDTRANS_SERVER_KEY || '',
  clientKey: env.MIDTRANS_CLIENT_KEY || '',
});

// POST /api/payments/create — buat transaksi
router.post('/create', authenticate, async (req: any, res, next) => {
  try {
    const { orderId, method = 'QRIS' } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, serviceType: true },
    });
    if (!order) throw new AppError('Pesanan tidak ditemukan.', 404);
    if (order.userId !== req.user.id) throw new AppError('Tidak memiliki akses.', 403);

    const amount = order.totalCost ?? order.estimatedCost ?? order.serviceType?.basePrice;
    if (amount == null) throw new AppError('Harga pesanan tidak ditemukan. Pastikan jenis layanan dipilih.', 400);

    const snapOrderId = `GOMONTIR-${orderId}-${Date.now()}`;

    // Payload untuk Midtrans
    const snapPayload = {
      transaction_details: {
        order_id: snapOrderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: order.user.name,
        email: order.user.email,
        phone: order.user.phone ?? '-',
      },
    };

    let gatewayToken: string | null = null;
    let paymentUrl: string | null = null;

    if (method !== 'COD') {
      if (!env.MIDTRANS_SERVER_KEY) {
        throw new AppError('Midtrans Server Key belum dikonfigurasi di server. Silakan hubungi admin.', 500);
      }
      try {
        const snapResponse = await snap.createTransaction(snapPayload);
        gatewayToken = snapResponse.token;
        paymentUrl = snapResponse.redirect_url;
      } catch (error: any) {
        console.error('Midtrans error:', error);
        throw new AppError(`Gagal membuat transaksi ke Midtrans: ${error.message || error}`, 500);
      }
    }

    // Simpan transaksi
    const transaction = await prisma.transaction.upsert({
      where: { orderId },
      update: { 
        amount, 
        status: 'PENDING',
        method: method === 'COD' ? 'TUNAI' : 'QRIS',
        gatewayRef: method === 'COD' ? `COD-${orderId}-${Date.now()}` : snapOrderId,
        gatewayToken,
        paymentUrl,
      },
      create: {
        orderId,
        amount,
        status: 'PENDING',
        method: method === 'COD' ? 'TUNAI' : 'QRIS',
        gatewayRef: method === 'COD' ? `COD-${orderId}-${Date.now()}` : snapOrderId,
        gatewayToken,
        paymentUrl,
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      message: method === 'COD' ? 'Metode COD dipilih.' : 'Transaksi dibuat. Silakan selesaikan pembayaran.',
      data: {
        transaction,
        snapPayload: method === 'COD' ? null : { ...snapPayload, token: gatewayToken, redirect_url: paymentUrl },
        clientKey: env.MIDTRANS_CLIENT_KEY,
        isProduction: env.MIDTRANS_IS_PRODUCTION,
      },
    });
  } catch (e) { next(e); }
});

// POST /api/payments/webhook — Midtrans callback
router.post('/webhook', async (req, res, next) => {
  try {
    const { order_id, status_code, gross_amount, transaction_status, fraud_status, signature_key } = req.body;

    // Verify signature key to ensure request comes from Midtrans
    if (env.MIDTRANS_SERVER_KEY) {
      const hash = crypto
        .createHash('sha512')
        .update(order_id + status_code + gross_amount + env.MIDTRANS_SERVER_KEY)
        .digest('hex');
      
      if (hash !== signature_key) {
        throw new AppError('Signature key tidak valid.', 401);
      }
    }

    let paymentStatus: 'PAID' | 'FAILED' | 'EXPIRED' | 'PENDING' = 'PENDING';
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      if (fraud_status === 'accept' || !fraud_status) {
        paymentStatus = 'PAID';
      } else {
        paymentStatus = 'FAILED';
      }
    } else if (transaction_status === 'deny' || transaction_status === 'cancel') {
      paymentStatus = 'FAILED';
    } else if (transaction_status === 'expire') {
      paymentStatus = 'EXPIRED';
    } else if (transaction_status === 'pending') {
      paymentStatus = 'PENDING';
    }

    // Update transaction
    const transactions = await prisma.transaction.findMany({
      where: { gatewayRef: order_id }
    });

    if (transactions.length > 0) {
      const tx = transactions[0];
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          status: paymentStatus === 'PENDING' ? 'PENDING' : paymentStatus,
          ...(paymentStatus === 'PAID' && { paidAt: new Date() }),
          metadata: req.body,
        },
      });

      // Kirim Notifikasi
      if (paymentStatus === 'PAID') {
        const order = await prisma.order.findUnique({
          where: { id: tx.orderId },
          include: { user: true, mechanic: true },
        });
        if (order) {
          // Kirim notifikasi ke user
          await prisma.notification.create({
            data: {
              userId: order.userId,
              type: 'PAYMENT_UPDATE',
              title: 'Pembayaran Berhasil',
              body: `Pembayaran sebesar Rp ${tx.amount.toLocaleString('id-ID')} telah dikonfirmasi. Terima kasih!`,
              data: { orderId: order.id },
            }
          });
          // Kirim notifikasi ke montir jika ditugaskan
          if (order.mechanic) {
            await prisma.notification.create({
              data: {
                userId: order.mechanic.userId,
                type: 'PAYMENT_UPDATE',
                title: 'Pembayaran Diterima',
                body: `Pelanggan ${order.user.name} telah melunasi pembayaran sebesar Rp ${tx.amount.toLocaleString('id-ID')}.`,
                data: { orderId: order.id },
              }
            });
          }
        }
      }
    }

    res.json({ success: true });
  } catch (e) { next(e); }
});

// POST /api/payments/confirm/:transactionId — Montir konfirmasi pembayaran tunai
router.post('/confirm/:transactionId', authenticate, authorize(Role.MECHANIC), async (req: any, res, next) => {
  try {
    const { transactionId } = req.params;
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { order: { include: { mechanic: true } } },
    });

    if (!transaction) throw new AppError(`Transaksi dengan ID ${transactionId} tidak ditemukan.`, 404);
    
    const assignedMechanicUserId = transaction.order.mechanic?.userId;
    if (assignedMechanicUserId !== req.user.id) {
      console.log('Access Denied:', { assigned: assignedMechanicUserId, currentUser: req.user.id });
      throw new AppError('Anda bukan montir yang ditugaskan untuk pesanan ini.', 403);
    }

    if (transaction.method !== 'TUNAI') {
      throw new AppError(`Metode pembayaran ${transaction.method} tidak memerlukan konfirmasi manual.`, 400);
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    res.json({ success: true, message: 'Pembayaran telah dikonfirmasi.', data: updated });
  } catch (e) { next(e); }
});

export default router;
