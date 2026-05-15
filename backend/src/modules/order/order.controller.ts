import { Response, NextFunction } from 'express';
import * as orderService from './order.service';
import { AuthRequest } from '@/middlewares/authenticate';
import prisma from '@/config/database';
import { AppError } from '@/middlewares/errorHandler';

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await orderService.createOrder(req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Pesanan berhasil dibuat.', data });
  } catch (e) { next(e); }
};

export const getOrderDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await orderService.getOrderDetail(
      req.params.orderId as string, req.user!.id, req.user!.role
    );
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, cancelReason } = req.body;
    const data = await orderService.updateOrderStatus(
      req.params.orderId as string, status, req.user!.id, cancelReason
    );
    res.json({ success: true, message: `Status diperbarui: ${status}`, data });
  } catch (e) { next(e); }
};

export const acceptOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await orderService.acceptOrder(req.user!.id, req.params.orderId as string);
    res.json({ success: true, message: 'Pesanan berhasil diterima.', data });
  } catch (e) { next(e); }
};

export const submitReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId as string },
      include: { mechanic: true },
    });
    if (!order) throw new AppError('Pesanan tidak ditemukan.', 404);
    if (order.userId !== req.user!.id) throw new AppError('Tidak memiliki akses.', 403);
    if (order.status !== 'COMPLETED') throw new AppError('Pesanan belum selesai.', 400);
    if (!order.mechanicId) throw new AppError('Tidak ada montir untuk direview.', 400);

    const { rating, comment } = req.body;

    const [review] = await prisma.$transaction([
      prisma.review.create({
        data: {
          orderId: order.id,
          reviewerId: req.user!.id,
          mechanicId: order.mechanicId,
          rating,
          comment,
        },
      }),
      // Update average rating montir
      prisma.mechanicProfile.update({
        where: { id: order.mechanicId },
        data: {
          totalReviews: { increment: 1 },
          rating: {
            set: await prisma.review
              .aggregate({ where: { mechanicId: order.mechanicId }, _avg: { rating: true } })
              .then((r: any) => r._avg.rating ?? rating),
          },
        },
      }),
    ]);

    res.status(201).json({ success: true, message: 'Review berhasil dikirim.', data: review });
  } catch (e) { next(e); }
};
