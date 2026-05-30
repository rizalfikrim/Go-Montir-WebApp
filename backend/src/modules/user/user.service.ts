import prisma from '@/config/database';
import { AppError } from '@/middlewares/errorHandler';
import { UpdateProfileDto, AddVehicleDto, UpdateVehicleDto } from './user.schema';

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, avatarUrl: true, isVerified: true, createdAt: true,
      vehicles: true,
      mechanic: {
        select: {
          id: true, specializations: true, status: true,
          rating: true, totalReviews: true, isOnline: true,
        },
      },
    },
  });

  if (!user) throw new AppError('User tidak ditemukan.', 404);
  return user;
};

export const updateProfile = async (userId: string, dto: UpdateProfileDto) => {
  return prisma.user.update({
    where: { id: userId },
    data: dto,
    select: {
      id: true, name: true, email: true,
      phone: true, avatarUrl: true, updatedAt: true,
    },
  });
};

export const addVehicle = async (userId: string, dto: AddVehicleDto) => {
  // Jika isDefault, unset semua kendaraan lain
  if (dto.isDefault) {
    await prisma.vehicleInfo.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  return prisma.vehicleInfo.create({
    data: { ...dto, userId },
  });
};

export const updateVehicle = async (userId: string, vehicleId: string, dto: UpdateVehicleDto) => {
  // Validasi ownership
  const vehicle = await prisma.vehicleInfo.findFirst({
    where: { id: vehicleId, userId },
  });
  if (!vehicle) throw new AppError('Kendaraan tidak ditemukan.', 404);

  // Jika isDefault true, unset semua kendaraan lain
  if (dto.isDefault) {
    await prisma.vehicleInfo.updateMany({
      where: { userId, id: { not: vehicleId } },
      data: { isDefault: false },
    });
  }

  return prisma.vehicleInfo.update({
    where: { id: vehicleId },
    data: dto,
  });
};

export const getVehicles = async (userId: string) => {
  return prisma.vehicleInfo.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
};

export const deleteVehicle = async (userId: string, vehicleId: string) => {
  const vehicle = await prisma.vehicleInfo.findFirst({
    where: { id: vehicleId, userId },
  });
  if (!vehicle) throw new AppError('Kendaraan tidak ditemukan.', 404);

  await prisma.vehicleInfo.delete({ where: { id: vehicleId } });
};

export const getOrderHistory = async (userId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [total, orders] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.order.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        mechanic: { select: { id: true, rating: true, user: { select: { name: true, avatarUrl: true } } } },
        serviceType: { select: { name: true, iconUrl: true } },
        vehicle: { select: { brand: true, model: true, type: true } },
        transaction: { select: { status: true, amount: true } },
      },
    }),
  ]);

  return { orders, total, page, totalPages: Math.ceil(total / limit) };
};
