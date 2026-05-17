import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/authenticate';
import prisma from '@/config/database';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

// GET /api/admin/dashboard — statistik ringkas
router.get('/dashboard', async (_req, res, next) => {
  try {
    const [totalUsers, totalMechanics, totalOrders, totalRevenue, recentOrders] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'MECHANIC' } }),
      prisma.order.count(),
      prisma.transaction.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
          mechanic: { include: { user: { select: { name: true } } } },
          serviceType: { select: { name: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalMechanics,
          totalOrders,
          totalRevenue: totalRevenue._sum.amount ?? 0,
        },
        recentOrders,
      },
    });
  } catch (e) { next(e); }
});

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role && role !== 'ALL') {
      where.role = role;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where, skip, take: limit,
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, isVerified: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({ success: true, data: { users, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (e) { next(e); }
});

// PATCH /api/admin/users/:id/toggle-active
router.patch('/users/:id/toggle-active', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
    });

    res.json({ success: true, message: `User ${updated.isActive ? 'diaktifkan' : 'dinonaktifkan'}.` });
  } catch (e) { next(e); }
});

// PATCH /api/admin/users/:id/verify
router.patch('/users/:id/verify', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: !user.isVerified },
    });

    res.json({ success: true, message: `Verifikasi ${updated.isVerified ? 'diberikan' : 'dicabut'}.` });
  } catch (e) { next(e); }
});

// GET /api/admin/orders
router.get('/orders', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const status = req.query.status as string | undefined;
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: any = status ? { status } : {};
    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, phone: true } },
          mechanic: { include: { user: { select: { name: true } } } },
          serviceType: { select: { name: true } },
          transaction: { select: { status: true, amount: true } },
        },
      }),
    ]);

    res.json({ success: true, data: { orders, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (e) { next(e); }
});

export default router;
