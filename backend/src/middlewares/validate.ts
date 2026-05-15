import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '@/middlewares/errorHandler';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.issues.map(
        (e: any) => `${e.path.join('.')}: ${e.message}`
      );
      return next(new AppError(`Validasi gagal: ${messages.join(' | ')}`, 400));
    }
    req.body = result.data;
    next();
  };
};
