import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '@/middlewares/authenticate';
import prisma from '@/config/database';
import { AppError } from '@/middlewares/errorHandler';

const router = Router();

// GET /api/subscriptions — list paket
router.get('/', async (_req, res, next) => {
  try {
    const data = await prisma.subscriptionPackage.findMany({
      where: { isActive: true }, orderBy: { price: 'asc' },
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// POST /api/subscriptions/purchase — Mechanic beli paket
router.post('/purchase', authenticate, authorize('MECHANIC'), async (req: AuthRequest, res, next) => {
  try {
    const { packageId } = req.body;
    const pkg = await prisma.subscriptionPackage.findUnique({ where: { id: packageId } });
    if (!pkg) throw new AppError('Paket tidak ditemukan.', 404);

    const mechanic = await prisma.mechanicProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!mechanic) throw new AppError('Profil montir tidak ditemukan.', 404);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + pkg.durationDay);

    const subscription = await prisma.mechanicSubscription.create({
      data: {
        mechanicId: mechanic.id,
        packageId,
        endDate,
        status: 'ACTIVE',
      },
      include: { package: true },
    });

    res.status(201).json({
      success: true,
      message: `Berhasil berlangganan paket ${pkg.name}`,
      data: subscription,
    });
  } catch (e) { next(e); }
});

// GET /api/subscriptions/my — montir lihat paket aktif
router.get('/my', authenticate, authorize('MECHANIC'), async (req: AuthRequest, res, next) => {
  try {
    const mechanic = await prisma.mechanicProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!mechanic) throw new AppError('Profil montir tidak ditemukan.', 404);

    const data = await prisma.mechanicSubscription.findMany({
      where: { mechanicId: mechanic.id },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

export default router;
