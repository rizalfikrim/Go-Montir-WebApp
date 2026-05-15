import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { updateLocation } from '@/modules/mechanic/mechanic.service';

interface SocketUser {
  id: string;
  role: string;
}

export const setupSocketIO = (io: Server) => {
  // ========================
  // Auth Middleware untuk Socket
  // ========================
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Authentication error: No token'));

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as SocketUser;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    console.log(`🔌 Socket connected: ${user.id} (${user.role})`);

    // ========================
    // Join Personal Room
    // ========================
    socket.join(`user:${user.id}`);
    if (user.role === 'MECHANIC') {
      socket.join(`mechanic:${user.id}`);
    }
    if (user.role === 'ADMIN') {
      socket.join('admin:dashboard');
    }

    // ========================
    // Join Order Room
    // ========================
    socket.on('join_order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`📦 User ${user.id} joined order room: ${orderId}`);
    });

    socket.on('leave_order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    // ========================
    // Mechanic Location Update (via Socket)
    // ========================
    socket.on('update_location', async (data: { lat: number; lon: number; orderId?: string }) => {
      if (user.role !== 'MECHANIC') return;

      try {
        await updateLocation(user.id, data.lat, data.lon);

        // Broadcast ke order room jika sedang OTW
        if (data.orderId) {
          io.to(`order:${data.orderId}`).emit('mechanic_location', {
            lat: data.lat,
            lon: data.lon,
            timestamp: new Date().toISOString(),
          });
        }

        // Broadcast ke admin dashboard
        io.to('admin:dashboard').emit('mechanic_location_update', {
          mechanicUserId: user.id,
          lat: data.lat,
          lon: data.lon,
        });
      } catch (err) {
        console.error('Location update error:', err);
      }
    });

    // ========================
    // Typing / Ping (opsional)
    // ========================
    socket.on('ping', () => socket.emit('pong', { time: Date.now() }));

    // ========================
    // Disconnect
    // ========================
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${user.id} — ${reason}`);
    });
  });
};
