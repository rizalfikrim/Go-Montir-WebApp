import { Router } from 'express';
import * as ctrl from './order.controller';
import { authenticate, authorize } from '@/middlewares/authenticate';
import { validate } from '@/middlewares/validate';
import { createOrderSchema, updateStatusSchema, submitReviewSchema } from './order.schema';

const router = Router();

router.use(authenticate);

router.post('/', authorize('USER'), validate(createOrderSchema), ctrl.createOrder);
router.get('/:orderId', ctrl.getOrderDetail);
router.patch('/:orderId/status', validate(updateStatusSchema), ctrl.updateStatus);
router.post('/:orderId/accept', authorize('MECHANIC'), ctrl.acceptOrder);
router.post('/:orderId/review', authorize('USER'), validate(submitReviewSchema), ctrl.submitReview);

export default router;
