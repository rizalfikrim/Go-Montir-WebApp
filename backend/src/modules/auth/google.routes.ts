import { Router } from 'express';
import * as googleController from '@/modules/auth/google.controller';
import passport from '@/config/passport';

const router = Router();

// ========================================
// Web-based OAuth (redirect flow)
// ========================================

// GET /api/auth/google
// Redirect ke Google login page
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /api/auth/google/callback
// Google redirect ke sini, kemudian redirect ke frontend
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/login' }) as any,
  googleController.googleCallback
);

// ========================================
// Mobile-friendly endpoints (no redirect)
// ========================================

// POST /api/auth/google/register
// Login/Register via Google untuk mobile apps
// Body: { googleId, displayName, email, photoUrl, role? }
router.post('/google/register', googleController.googleRegister);

// GET /api/auth/google/user/:googleId
// Ambil info user dari Google ID
router.get('/google/user/:googleId', googleController.getGoogleUser);

export default router;
