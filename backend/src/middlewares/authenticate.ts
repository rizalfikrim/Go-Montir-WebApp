import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '@/config/env';
import { AppError } from '@/middlewares/errorHandler';
import prisma from '@/config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    name: string;
    avatarUrl?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Ambil token dari cookie atau Authorization header
    const token =
      req.cookies?.access_token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Akses ditolak. Token tidak ditemukan.', 401);
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      id: string;
      email: string;
      role: Role;
    };

    // Verifikasi user masih ada & aktif
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true, name: true, avatarUrl: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('Akun tidak ditemukan atau sudah dinonaktifkan.', 401);
    }

    req.user = { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      name: user.name,
      avatarUrl: user.avatarUrl || undefined
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Token tidak valid.', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token sudah kedaluwarsa.', 401));
    }
    next(error);
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Tidak terautentikasi.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Tidak memiliki izin untuk aksi ini.', 403));
    }
    next();
  };
};
