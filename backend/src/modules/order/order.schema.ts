import { z } from 'zod';

export const createOrderSchema = z.object({
  serviceTypeId: z.string().optional(),
  vehicleId: z.string().optional(),
  vehicleName: z.string().optional(),
  mechanicId: z.string().optional(),
  description: z.string().max(500).optional(),
  userLatitude: z.number().min(-90).max(90),
  userLongitude: z.number().min(-180).max(180),
  userAddress: z.string().max(255).optional(),
  scheduledAt: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
});

export const updateStatusSchema = z.object({
  status: z.enum(['OTW', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  cancelReason: z.string().max(255).optional(),
});

export const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});
