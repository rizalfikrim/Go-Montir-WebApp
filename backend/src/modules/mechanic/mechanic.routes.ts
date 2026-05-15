import { Router } from 'express';
import * as ctrl from './mechanic.controller';
import { authenticate, authorize } from '@/middlewares/authenticate';

const router = Router();

// Public
router.get('/nearby', ctrl.getNearby);
router.get('/:mechanicId', ctrl.getProfile);

// Mechanic only
router.get('/me/profile', authenticate, authorize('MECHANIC'), ctrl.getMyProfile);
router.patch('/me/profile', authenticate, authorize('MECHANIC'), ctrl.updateProfile);
router.patch('/me/online', authenticate, authorize('MECHANIC'), ctrl.setOnlineStatus);
router.patch('/me/location', authenticate, authorize('MECHANIC'), ctrl.updateLocation);
router.get('/me/orders', authenticate, authorize('MECHANIC'), ctrl.getOrders);

export default router;
