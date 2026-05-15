import prisma from '@/config/database';
import { AppError } from '@/middlewares/errorHandler';

// Hitung jarak pakai Haversine formula (km)
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getNearbyMechanics = async (
  userLat: number,
  userLon: number,
  radiusKm = 50 // Perluas default radius ke 50km
) => {
  // Ambil semua montir yang aktif dan punya lokasi
  const mechanics = await prisma.mechanicProfile.findMany({
    where: {
      status: 'ACTIVE',
      lastLatitude: { not: null },
      lastLongitude: { not: null },
    },
    include: {
      user: { select: { name: true, avatarUrl: true, phone: true } },
    },
  });

  // Hitung jarak dan filter hanya yang Online & dalam radius
  const results = mechanics
    .map((m) => ({
      ...m,
      distanceKm: haversineDistance(
        userLat, userLon,
        m.lastLatitude!, m.lastLongitude!
      ),
    }))
    .filter((m) => m.isOnline && m.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return results;
};

export const getMechanicProfile = async (mechanicId: string) => {
  const mechanic = await prisma.mechanicProfile.findUnique({
    where: { id: mechanicId },
    include: {
      user: { select: { name: true, avatarUrl: true, phone: true, email: true } },
      reviewsReceived: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { reviewer: { select: { name: true, avatarUrl: true } } },
      },
    },
  });
  if (!mechanic) throw new AppError('Profil montir tidak ditemukan.', 404);
  return mechanic;
};

export const getMechanicProfileByUserId = async (userId: string) => {
  const mechanic = await prisma.mechanicProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, avatarUrl: true, phone: true, email: true } },
    },
  });
  if (!mechanic) throw new AppError('Profil montir tidak ditemukan.', 404);
  return mechanic;
};

export const updateMechanicProfile = async (userId: string, data: {
  bio?: string;
  specializations?: string[];
  certificationUrl?: string;
}) => {
  return prisma.mechanicProfile.update({
    where: { userId },
    data,
  });
};

export const setOnlineStatus = async (userId: string, isOnline: boolean) => {
  return prisma.mechanicProfile.update({
    where: { userId },
    data: { isOnline },
  });
};

export const updateLocation = async (
  userId: string,
  lat: number,
  lon: number
) => {
  return prisma.mechanicProfile.update({
    where: { userId },
    data: {
      lastLatitude: lat,
      lastLongitude: lon,
      lastLocationAt: new Date(),
    },
  });
};

export const getMechanicOrders = async (userId: string, page = 1, limit = 10) => {
  const mechanic = await prisma.mechanicProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!mechanic) throw new AppError('Profil montir tidak ditemukan.', 404);

  const skip = (page - 1) * limit;
  const [total, orders] = await Promise.all([
    prisma.order.count({ where: { mechanicId: mechanic.id } }),
    prisma.order.findMany({
      where: { mechanicId: mechanic.id },
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, phone: true, avatarUrl: true } },
        serviceType: { select: { name: true } },
        vehicle: { select: { brand: true, model: true, type: true } },
      },
    }),
  ]);

  return { orders, total, page, totalPages: Math.ceil(total / limit) };
};
