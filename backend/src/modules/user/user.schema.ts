import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Format nomor HP tidak valid')
    .optional(),
  avatarUrl: z.string().url().optional(),
});

export const addVehicleSchema = z.object({
  brand: z.string().min(1, 'Merek wajib diisi'),
  model: z.string().min(1, 'Model wajib diisi'),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  type: z.enum(['MOTOR', 'MOBIL', 'TRUK']),
  plateNumber: z.string().optional(),
  color: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type AddVehicleDto = z.infer<typeof addVehicleSchema>;
