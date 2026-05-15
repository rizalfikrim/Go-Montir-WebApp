import { Router } from 'express';
import * as ctrl from './user.controller';
import { authenticate } from '@/middlewares/authenticate';
import { validate } from '@/middlewares/validate';
import { updateProfileSchema, addVehicleSchema } from './user.schema';

const router = Router();

router.use(authenticate);

router.get('/profile', ctrl.getProfile);
router.patch('/profile', validate(updateProfileSchema), ctrl.updateProfile);
router.get('/vehicles', ctrl.getVehicles);
router.post('/vehicles', validate(addVehicleSchema), ctrl.addVehicle);
router.delete('/vehicles/:vehicleId', ctrl.deleteVehicle);
router.get('/orders', ctrl.getOrderHistory);

export default router;
