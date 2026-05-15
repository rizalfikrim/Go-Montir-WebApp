import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '@/config/database';
import { env } from '@/config/env';
import { AppError } from '@/middlewares/errorHandler';
import { RegisterDto, LoginDto } from '@/modules/auth/auth.schema';

// ========================
// Token Helpers
// ========================
const generateAccessToken = (payload: { id: string; email: string; role: Role }) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY as any });

const generateRefreshToken = (payload: { id: string }) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY as any });

const SALT_ROUNDS = 12;

// ========================
// Register
// ========================
export const register = async (dto: RegisterDto) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
  });

  if (existing) {
    if (existing.email === dto.email) {
      throw new AppError('Email sudah terdaftar.', 409);
    }
    throw new AppError('Nomor HP sudah terdaftar.', 409);
  }

  const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      role: dto.role,
      // Jika role MECHANIC, buat profil kosong otomatis
      mechanic:
        dto.role === 'MECHANIC'
          ? { create: { specializations: [], status: 'ACTIVE' } }
          : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user.id,
      newValue: { email: user.email, role: user.role },
    },
  });

  return user;
};

// ========================
// Login
// ========================
export const login = async (dto: LoginDto) => {
  const user = await prisma.user.findUnique({
    where: { email: dto.email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      password: true,
      isActive: true,
      avatarUrl: true,
    },
  });

  if (!user) throw new AppError('Email atau password salah.', 401);
  if (!user.isActive) throw new AppError('Akun Anda telah dinonaktifkan.', 403);

  const isMatch = await bcrypt.compare(dto.password, user.password);
  if (!isMatch) throw new AppError('Email atau password salah.', 401);

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({ id: user.id });

  // Simpan refresh token ke DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  const { password: _pw, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, accessToken, refreshToken };
};

// ========================
// Refresh Token
// ========================
export const refreshAccessToken = async (token: string) => {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
  });

  if (!storedToken) throw new AppError('Refresh token tidak valid.', 401);
  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token } });
    throw new AppError('Refresh token sudah kedaluwarsa. Silakan login ulang.', 401);
  }
  if (!storedToken.user.isActive) throw new AppError('Akun tidak aktif.', 403);

  // Verifikasi JWT
  try {
    jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch {
    await prisma.refreshToken.delete({ where: { token } });
    throw new AppError('Refresh token tidak valid.', 401);
  }

  const newAccessToken = generateAccessToken({
    id: storedToken.user.id,
    email: storedToken.user.email,
    role: storedToken.user.role,
  });

  return { accessToken: newAccessToken };
};

// ========================
// Logout
// ========================
export const logout = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

// ========================
// Logout All (Semua Device)
// ========================
export const logoutAll = async (userId: string) => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};
