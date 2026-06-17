import { Request, Response, NextFunction } from 'express';
import * as googleService from '@/modules/auth/google.service';
import { GoogleProfile } from '@/modules/auth/google.service';
import { Role } from '@prisma/client';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
};

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 15 * 60 * 1000, // 15 menit
};

// GET /api/auth/google
// Redirect ke Google untuk login
export const googleLogin = (req: Request, res: Response) => {
  // Middleware passport akan handle ini
  res.json({ success: false, message: 'Akses via Passport middleware' });
};

// GET /api/auth/google/callback
// Google redirect ke sini setelah user approve
export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Google authentication gagal.',
      });
    }

    const profile = req.user as unknown as GoogleProfile;
    const role = (req.query.role as Role) || 'USER';

    const { user, accessToken, refreshToken } = await googleService.googleOAuthHandler(profile, role);

    // Set tokens ke HttpOnly Cookie
    res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

    // Redirect ke frontend dengan token di query params
    const redirectUrl = `${process.env.CLIENT_URL}/auth/success?access_token=${accessToken}&refresh_token=${refreshToken}&userId=${user.id}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Google authentication gagal';
    res.redirect(`${process.env.CLIENT_URL}/auth/error?message=${encodeURIComponent(errorMessage)}`);
  }
};

// GET /api/auth/google/user/:googleId
// Get user info by Google ID
export const getGoogleUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const googleId = Array.isArray(req.params.googleId)
      ? req.params.googleId[0]
      : req.params.googleId;
    
    const user = await googleService.getUserByGoogleId(googleId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/google/register
// Mobile-friendly endpoint untuk register via Google tanpa redirect
export const googleRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { googleId, displayName, email, photoUrl, role } = req.body;

    console.log(`📱 [GOOGLE REGISTER] Request received`)
    console.log(`   Email: ${email}`)
    console.log(`   PhotoUrl: ${photoUrl ? '✓ Present' : '✗ Missing'}`)
    console.log(`   Role: ${role || 'USER'}`)

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message: 'googleId dan email wajib diisi.',
      });
    }

    const profile: GoogleProfile = {
      id: googleId,
      displayName: displayName || email.split('@')[0],
      emails: [{ value: email }],
      photos: photoUrl ? [{ value: photoUrl }] : [],
      provider: 'google',
    };

    console.log(`   Profile object created with ${photoUrl ? '✓ photo' : '✗ no photo'}`)

    const { user, accessToken, refreshToken } = await googleService.googleOAuthHandler(
      profile,
      role || 'USER'
    );

    console.log(`✅ [GOOGLE REGISTER] Success - User: ${user.id}, Avatar: ${user.avatarUrl ? 'Yes' : 'No'}`)

    // Set tokens ke HttpOnly Cookie
    res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      message: 'Login/Registrasi Google berhasil!',
      data: { user, accessToken },
    });
  } catch (error) {
    console.error('❌ [GOOGLE REGISTER] Error:', error)
    next(error);
  }
};
