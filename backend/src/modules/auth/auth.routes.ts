import { Router } from 'express';
import * as authController from '@/modules/auth/auth.controller';
import { validate } from '@/middlewares/validate';
import { authenticate } from '@/middlewares/authenticate';
import { registerSchema, loginSchema } from '@/modules/auth/auth.schema';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected routes
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.getMe);

export default router;
