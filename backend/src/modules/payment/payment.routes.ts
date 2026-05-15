import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/authenticate';
import { AppError } from '@/middlewares/errorHandler';
import prisma from '@/config/database';
import { env } from '@/config/env';
import { Role } from '@prisma/client';

const router = Router();
router.use(authenticate);

// POST /api/payments/create — buat transaksi
router.post('/create', async (req: any, res, next) => {
  try {
    const { orderId, method = 'QRIS' } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, serviceType: true },
    });
    if (!order) throw new AppError('Pesanan tidak ditemukan.', 404);
    if (order.userId !== req.user.id) throw new AppError('Tidak memiliki akses.', 403);

    const amount = order.totalCost || order.estimatedCost || order.serviceType?.basePrice || 50000;

    // Payload untuk Midtrans (hanya jika online)
    const snapPayload = {
      transaction_details: {
        order_id: `GOMONTIR-${orderId}-${Date.now()}`,
        gross_amount: amount,
      },
      customer_details: {
        first_name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
      },
    };

    // Simpan transaksi
    const transaction = await prisma.transaction.upsert({
      where: { orderId },
      update: { 
        amount, 
        status: method === 'COD' ? 'PENDING' : 'PENDING',
        method: method === 'COD' ? 'TUNAI' : 'QRIS'
      },
      create: {
        orderId,
        amount,
        status: 'PENDING',
        method: method === 'COD' ? 'TUNAI' : 'QRIS',
        gatewayRef: method === 'COD' ? `COD-${orderId}-${Date.now()}` : snapPayload.transaction_details.order_id,
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      message: method === 'COD' ? 'Metode COD dipilih.' : 'Transaksi dibuat. Silakan selesaikan pembayaran.',
      data: {
        transaction,
        snapPayload: method === 'COD' ? null : snapPayload,
        clientKey: env.MIDTRANS_CLIENT_KEY,
      },
    });
  } catch (e) { next(e); }
});

// POST /api/payments/webhook — Midtrans callback
router.post('/webhook', async (req, res, next) => {
  try {
    const { order_id, transaction_status, fraud_status } = req.body;

    let paymentStatus: 'PAID' | 'FAILED' | 'EXPIRED' = 'FAILED';
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      if (fraud_status === 'accept' || !fraud_status) paymentStatus = 'PAID';
    } else if (transaction_status === 'expire') {
      paymentStatus = 'EXPIRED';
    }

    await prisma.transaction.updateMany({
      where: { gatewayRef: order_id },
      data: {
        status: paymentStatus,
        ...(paymentStatus === 'PAID' && { paidAt: new Date() }),
        metadata: req.body,
      },
    });

    res.json({ success: true });
  } catch (e) { next(e); }
});

// POST /api/payments/confirm/:transactionId — Montir konfirmasi pembayaran tunai
router.post('/confirm/:transactionId', authorize(Role.MECHANIC), async (req: any, res, next) => {
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
