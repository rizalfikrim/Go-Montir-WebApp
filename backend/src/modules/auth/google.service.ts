import prisma from '@/config/database';
import { env } from '@/config/env';
import { AppError } from '@/middlewares/errorHandler';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface GoogleProfile {
  id: string;
  displayName: string;
  emails: Array<{ value: string }>;
  photos: Array<{ value: string }>;
  provider: string;
}

// ========================
// Token Helpers
// ========================
const generateAccessToken = (payload: { id: string; email: string; role: Role }) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY as any });

const generateRefreshToken = (payload: { id: string }) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY as any });

// ========================
// Google OAuth Login/Register
// ========================
export const googleOAuthHandler = async (profile: GoogleProfile, role: Role = 'USER') => {
  const email = profile.emails?.[0]?.value;
  const displayName = profile.displayName || email?.split('@')[0] || 'User';
  const avatarUrl = profile.photos?.[0]?.value;

  console.log(`🔐 [GOOGLE OAUTH] Processing login for ${email}`)
  console.log(`   Display Name: ${displayName}`)
  console.log(`   Avatar URL: ${avatarUrl ? '✓ Present' : '✗ Missing'}`)

  if (!email) {
    throw new AppError('Google profile tidak memiliki email.', 400);
  }

  // Cek apakah user sudah ada
  let user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      avatarUrl: true,
      googleId: true,
      oauthProvider: true,
    },
  });
  
  if (user) {
    // Jika user memilih login/register sebagai MECHANIC tetapi di DB masih bertipe USER, upgrade rolenya.
    if (role === 'MECHANIC' && user.role === 'USER') {
      console.log(`  → Upgrading user ${user.id} role from USER to MECHANIC`)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'MECHANIC',
          mechanic: {
            connectOrCreate: {
              where: { userId: user.id },
              create: { specializations: [], status: 'ACTIVE' }
            }
          }
        } as any
      });
      user.role = 'MECHANIC';
    }

    // Pastikan jika rolenya MECHANIC, dia memiliki profil mekanik
    if (user.role === 'MECHANIC') {
      const profileExists = await prisma.mechanicProfile.findUnique({ where: { userId: user.id } });
      if (!profileExists) {
        console.log(`  → Creating missing mechanic profile for existing mechanic user ${user.id}`)
        await prisma.mechanicProfile.create({
          data: {
            userId: user.id,
            specializations: [],
            status: 'ACTIVE'
          }
        });
      }
    }
  }

  // Jika user belum ada, buat akun baru
  if (!user) {
    // Generate nomor HP sementara (user bisa update nanti)
    const tempPhone = `+62${Date.now().toString().slice(-10)}`;

    console.log(`  → Creating new user with avatarUrl: ${avatarUrl ? '✓' : '✗'}`)

    const newUser = await prisma.user.create({
      data: {
        email,
        name: displayName,
        phone: tempPhone,
        avatarUrl: avatarUrl || null,
        googleId: profile.id,
        oauthProvider: 'google',
        isVerified: true, // Otomatis verified karena dari Google
        role,
        // Jika role MECHANIC, buat profil kosong otomatis
        mechanic:
          role === 'MECHANIC'
            ? { create: { specializations: [], status: 'ACTIVE' } }
            : undefined,
      } as any, // Type assertion untuk Prisma
    });

    console.log(`  ✅ User created: ${newUser.id} with avatar: ${newUser.avatarUrl ? 'Yes' : 'No'}`)

    user = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      isActive: newUser.isActive,
      avatarUrl: newUser.avatarUrl,
      googleId: newUser.googleId,
      oauthProvider: newUser.oauthProvider,
    };

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: 'USER_REGISTERED',
        entity: 'User',
        entityId: newUser.id,
        newValue: { email: newUser.email, role: newUser.role, provider: 'google', avatarUrl },
      },
    });
  } else if (!user.googleId) {
    // Update user yang sudah ada untuk menambahkan Google OAuth
    console.log(`  → Linking Google OAuth to existing user ${user.id}`)
    console.log(`  → Updating avatarUrl: ${avatarUrl ? '✓' : '✗'}`)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: profile.id,
        oauthProvider: 'google',
        isVerified: true,
        avatarUrl: avatarUrl || user.avatarUrl,
      } as any, // Type assertion untuk Prisma
    });

    console.log(`  ✅ User updated: ${updatedUser.id} with avatar: ${updatedUser.avatarUrl ? 'Yes' : 'No'}`)

    user = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      avatarUrl: updatedUser.avatarUrl,
      googleId: updatedUser.googleId,
      oauthProvider: updatedUser.oauthProvider,
    };

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: updatedUser.id,
        action: 'GOOGLE_OAUTH_LINKED',
        entity: 'User',
        entityId: updatedUser.id,
        newValue: { email: updatedUser.email, googleId: profile.id, avatarUrl },
      },
    });
  }

  if (!user || !user.isActive) {
    throw new AppError('Akun Anda telah dinonaktifkan.', 403);
  }

  // Return user without sensitive fields
  const userResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    avatarUrl: user.avatarUrl,
  };

  // Generate tokens
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

  return { user: userResponse, accessToken, refreshToken };
};

// ========================
// Get User by Google ID
// ========================
export const getUserByGoogleId = async (googleId: string) => {
  return await prisma.user.findUnique({
    where: { googleId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      avatarUrl: true,
    },
  });
};
