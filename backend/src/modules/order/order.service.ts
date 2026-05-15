import { OrderStatus } from '@prisma/client';
import prisma from '@/config/database';
import { AppError } from '@/middlewares/errorHandler';
import { validateTransition, getTimestampField } from './order.stateMachine';
import { io } from '@/app';
import { getNearbyMechanics } from '@/modules/mechanic/mechanic.service';
import { createNotification } from '@/modules/notification/notification.service';

const MECHANIC_ACCEPT_TIMEOUT_MS = 30_000; // 30 detik

// ========================
// Create Order
// ========================
export const createOrder = async (userId: string, data: {
  serviceTypeId?: string;
  vehicleId?: string;
  vehicleName?: string;
  description?: string;
  userLatitude: number;
  userLongitude: number;
  userAddress?: string;
  scheduledAt?: Date;
  mechanicId?: string;
}) => {
  const order = await prisma.order.create({
    data: {
      userId,
      ...data,
      status: data.mechanicId ? 'WAITING_ACCEPT' : 'PENDING',
    },
    include: {
      serviceType: { select: { name: true, basePrice: true } },
      vehicle: true,
      mechanic: { include: { user: { select: { name: true } } } },
    },
  });

  // Notify user
  await createNotification(userId, {
    type: 'ORDER_UPDATE',
    title: 'Pesanan Dikirim!',
    body: data.mechanicId 
      ? `Pesanan Anda telah dikirim ke ${order.mechanic?.user.name}. Menunggu konfirmasi...`
      : `Pesanan sedang mencari montir terdekat...`,
    data: { orderId: order.id },
  });

  // Jika ada montir spesifik, langsung kirim ke dia
  if (data.mechanicId) {
    const mechanic = await prisma.mechanicProfile.findUnique({
      where: { id: data.mechanicId },
      select: { userId: true }
    });
    
    if (mechanic) {
      io.to(`mechanic:${mechanic.userId}`).emit('new_order_request', {
        order,
        distance: 'Terpilih',
      });
    }

    // Auto-cancel setelah 30 detik jika tidak ada yang accept
    setTimeout(async () => {
      const current = await prisma.order.findUnique({
        where: { id: order.id }, select: { status: true },
      });
      if (current?.status === 'WAITING_ACCEPT') {
        await updateOrderStatus(order.id, 'FAILED', 'system');
      }
    }, MECHANIC_ACCEPT_TIMEOUT_MS);

  } else {
    // Auto-trigger searching broadcast jika tidak ada montir spesifik
    await startSearching(order.id, data.userLatitude, data.userLongitude);
  }

  return order;
};

// ========================
// Start Searching (Dispatch)
// ========================
export const startSearching = async (
  orderId: string,
  lat: number,
  lon: number
) => {
  await updateOrderStatus(orderId, 'SEARCHING', 'system');

  // Cari montir dalam radius 10km, broadcast ke semua
  const nearbyMechanics = await getNearbyMechanics(lat, lon, 10);

  if (nearbyMechanics.length === 0) {
    await updateOrderStatus(orderId, 'FAILED', 'system');
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (order) {
      await createNotification(order.userId, {
        type: 'ORDER_UPDATE',
        title: 'Montir Tidak Ditemukan',
        body: 'Maaf, tidak ada montir yang tersedia di area Anda saat ini.',
        data: { orderId },
      });
    }
    return;
  }

  // Update ke WAITING_ACCEPT & broadcast ke montir
  await updateOrderStatus(orderId, 'WAITING_ACCEPT', 'system');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { name: true } }, serviceType: true, vehicle: true },
  });

  // Emit ke setiap montir terdekat (top 5)
  nearbyMechanics.slice(0, 5).forEach((mechanic: any) => {
    io.to(`mechanic:${mechanic.userId}`).emit('new_order_request', {
      order,
      distance: mechanic.distanceKm.toFixed(1),
    });
  });

  // Auto-cancel setelah 30 detik jika tidak ada yang accept
  setTimeout(async () => {
    const current = await prisma.order.findUnique({
      where: { id: orderId }, select: { status: true },
    });
    if (current?.status === 'WAITING_ACCEPT') {
      await updateOrderStatus(orderId, 'FAILED', 'system');
    }
  }, MECHANIC_ACCEPT_TIMEOUT_MS);
};

// ========================
// Accept Order (Mechanic)
// ========================
export const acceptOrder = async (mechanicUserId: string, orderId: string) => {
  const mechanic = await prisma.mechanicProfile.findUnique({
    where: { userId: mechanicUserId },
  });
  if (!mechanic) throw new AppError('Profil montir tidak ditemukan.', 404);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError('Pesanan tidak ditemukan.', 404);
  if (order.status !== 'WAITING_ACCEPT') {
    throw new AppError('Pesanan sudah diambil oleh montir lain.', 409);
  }

  validateTransition(order.status, 'MECHANIC_ACCEPTED');

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { mechanicId: mechanic.id, status: 'MECHANIC_ACCEPTED', acceptedAt: new Date() },
    include: {
      mechanic: { include: { user: { select: { name: true, phone: true, avatarUrl: true } } } },
    },
  });

  // Notify user
  await createNotification(order.userId, {
    type: 'ORDER_UPDATE',
    title: 'Montir Ditemukan! 🎉',
    body: `${updated.mechanic?.user.name} siap membantu Anda.`,
    data: { orderId },
  });

  // Notify room
  io.to(`order:${orderId}`).emit('order_status_changed', updated);

  return updated;
};

// ========================
// Update Status (Generic)
// ========================
export const updateOrderStatus = async (
  orderId: string,
  nextStatus: OrderStatus,
  requesterId: string,
  cancelReason?: string
) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError('Pesanan tidak ditemukan.', 404);

  if (requesterId !== 'system') validateTransition(order.status, nextStatus);

  const timestampField = getTimestampField(nextStatus);
  const updateData: any = {
    status: nextStatus,
    ...(cancelReason && { cancelReason }),
    ...(timestampField && { [timestampField]: new Date() }),
  };

  const updated = await prisma.order.update({ where: { id: orderId }, data: updateData });

  // Emit real-time update
  io.to(`order:${orderId}`).emit('order_status_changed', {
    orderId,
    status: nextStatus,
    timestamp: new Date(),
  });

  return updated;
};

// ========================
// Get Order Detail
// ========================
export const getOrderDetail = async (orderId: string, userId: string, userRole: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, phone: true, avatarUrl: true } },
      mechanic: {
        include: { user: { select: { name: true, phone: true, avatarUrl: true } } },
      },
      serviceType: true,
      vehicle: true,
      transaction: true,
      review: true,
    },
  });

  if (!order) throw new AppError('Pesanan tidak ditemukan.', 404);

  // Hanya user terkait atau admin yang boleh lihat
  const isOwner = order.userId === userId;
  const isMechanic = order.mechanic?.userId === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isOwner && !isMechanic && !isAdmin) {
    throw new AppError('Tidak memiliki akses ke pesanan ini.', 403);
  }

  return order;
};
