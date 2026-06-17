// import "dotenv/config";
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from '@/config/passport';
import { Server } from 'socket.io';
import chatbotRoutes from '@/modules/chatbot/chatbot.routes';

import { env } from '@/config/env';
import { errorHandler } from '@/middlewares/errorHandler';
import { rateLimiter } from '@/middlewares/rateLimiter';
import { setupSocketIO } from '@/modules/tracking/socket';

// Routes
import authRoutes from '@/modules/auth/auth.routes';
import userRoutes from '@/modules/user/user.routes';
import mechanicRoutes from '@/modules/mechanic/mechanic.routes';
import orderRoutes from '@/modules/order/order.routes';
import serviceRoutes from '@/modules/service/service.routes';
import subscriptionRoutes from '@/modules/subscription/subscription.routes';
import notificationRoutes from '@/modules/notification/notification.routes';
import paymentRoutes from '@/modules/payment/payment.routes';
import adminRoutes from '@/modules/admin/admin.routes';

const app = express();
const httpServer = http.createServer(app);

// ========================
// Socket.io Setup
// ========================
export const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});
setupSocketIO(io);

// ========================
// Global Middlewares
// ========================
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ========================
// Passport.js Setup (for OAuth)
// ========================
app.use(session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 jam
  },
}));
app.use(passport.initialize());
app.use(passport.session());

// ========================
// Rate Limiter
// ========================
app.use('/api/auth', rateLimiter({ windowMs: 15 * 60 * 1000, max: 1000 }));
app.use('/api', rateLimiter({ windowMs: 15 * 60 * 1000, max: 5000 }));

// ========================
// Health Check
// ========================
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'GoMontir API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ========================
// API Routes
// ========================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chatbot', chatbotRoutes);

// ========================
// 404 Handler
// ========================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route tidak ditemukan',
  });
});

// ========================
// Global Error Handler
// ========================
app.use(errorHandler);

// ========================
// Start Server
// ========================
httpServer.listen(env.PORT, '0.0.0.0', () => {
  console.log(`🚀 GoMontir API running on http://0.0.0.0:${env.PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
});

export default app;
