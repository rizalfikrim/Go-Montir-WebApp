import { Response, NextFunction } from 'express';
import * as userService from './user.service';
import { AuthRequest } from '@/middlewares/authenticate';

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await userService.getProfile(req.user!.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await userService.updateProfile(req.user!.id, req.body);
    res.json({ success: true, message: 'Profil berhasil diperbarui.', data });
  } catch (e) { next(e); }
};

export const addVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await userService.addVehicle(req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Kendaraan berhasil ditambahkan.', data });
  } catch (e) { next(e); }
};

export const updateVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await userService.updateVehicle(req.user!.id, req.params.vehicleId as string, req.body);
    res.json({ success: true, message: 'Kendaraan berhasil diperbarui.', data });
  } catch (e) { next(e); }
};

export const getVehicles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await userService.getVehicles(req.user!.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const deleteVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await userService.deleteVehicle(req.user!.id, req.params.vehicleId as string);
    res.json({ success: true, message: 'Kendaraan berhasil dihapus.' });
  } catch (e) { next(e); }
};

export const getOrderHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const data = await userService.getOrderHistory(req.user!.id, page, limit);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};
