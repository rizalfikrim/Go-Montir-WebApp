import { Response, NextFunction } from 'express';
import * as mechanicService from './mechanic.service';
import { AuthRequest } from '@/middlewares/authenticate';

export const getNearby = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lat, lon, radius } = req.query;
    if (!lat || !lon) return res.status(400).json({ success: false, message: 'lat dan lon wajib diisi.' });
    const data = await mechanicService.getNearbyMechanics(
      Number(lat), Number(lon), radius ? Number(radius) : 50
    );
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await mechanicService.getMechanicProfile(req.params.mechanicId as string);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const getMyProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await mechanicService.getMechanicProfileByUserId(req.user!.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await mechanicService.updateMechanicProfile(req.user!.id, req.body);
    res.json({ success: true, message: 'Profil montir diperbarui.', data });
  } catch (e) { next(e); }
};

export const setOnlineStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { isOnline } = req.body;
    await mechanicService.setOnlineStatus(req.user!.id, Boolean(isOnline));
    res.json({ success: true, message: `Status: ${isOnline ? 'Online' : 'Offline'}` });
  } catch (e) { next(e); }
};

export const updateLocation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lat, lon } = req.body;
    await mechanicService.updateLocation(req.user!.id, Number(lat), Number(lon));
    res.json({ success: true, message: 'Lokasi diperbarui.' });
  } catch (e) { next(e); }
};

export const getOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const data = await mechanicService.getMechanicOrders(req.user!.id, page, limit);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};
