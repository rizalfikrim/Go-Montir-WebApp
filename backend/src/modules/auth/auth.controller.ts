import { Request, Response, NextFunction } from 'express';
import * as authService from '@/modules/auth/auth.service';
import { AuthRequest } from '@/middlewares/authenticate';

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

// POST /api/auth/register
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Silakan login.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    // Set tokens ke HttpOnly Cookie
    res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      success: true,
      message: 'Login berhasil!',
      data: { user, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token tidak ditemukan.' });
    }

    const { accessToken } = await authService.refreshAccessToken(token);
    res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);

    res.json({ success: true, data: { accessToken } });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refresh_token;
    if (token) await authService.logout(token);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.json({ success: true, message: 'Logout berhasil.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout-all
export const logoutAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await authService.logoutAll(req.user!.id);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.json({ success: true, message: 'Logout dari semua perangkat berhasil.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};
