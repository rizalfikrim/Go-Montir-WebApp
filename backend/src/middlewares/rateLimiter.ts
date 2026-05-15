import rateLimit from 'express-rate-limit';

interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

export const rateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Terlalu banyak permintaan. Coba lagi nanti.',
}: RateLimiterOptions = {}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
    skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1',
  });
