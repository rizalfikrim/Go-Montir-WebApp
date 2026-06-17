import { Request, Response, NextFunction, RequestHandler } from 'express';
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

export const authenticate: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthRequest;
  try {
    // Ambil token dari cookie atau Authorization header
    const token =
      authReq.cookies?.access_token ||
      authReq.headers.authorization?.replace('Bearer ', '');

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

    authReq.user = { 
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

export const authorize = (...roles: Role[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return next(new AppError('Tidak terautentikasi.', 401));
    }
    if (!roles.includes(authReq.user.role)) {
      return next(new AppError('Tidak memiliki izin untuk aksi ini.', 403));
    }
    next();
  };
};
