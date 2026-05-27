import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/authenticate';
import prisma from '@/config/database';

const router = Router();

// GET /api/services — list semua service type aktif
router.get('/', async (req, res, next) => {
  try {
    const { vehicleType } = req.query;
    const filter: any = { isActive: true };
    
    if (vehicleType && typeof vehicleType === 'string') {
      filter.vehicleType = vehicleType.toUpperCase();
    }

    const data = await prisma.serviceType.findMany({
      where: filter,
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// POST /api/services — ADMIN only
router.post('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const data = await prisma.serviceType.create({ data: req.body });
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

// PATCH /api/services/:id — ADMIN only
router.patch('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const data = await prisma.serviceType.update({
      where: { id: req.params.id as string }, data: req.body,
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

export default router;
