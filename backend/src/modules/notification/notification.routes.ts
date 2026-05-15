import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import * as notifService from './notification.service';
import { AuthRequest } from '@/middlewares/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const data = await notifService.getNotifications(req.user!.id, page);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.patch('/read-all', async (req: AuthRequest, res, next) => {
  try {
    await notifService.markAllRead(req.user!.id);
    res.json({ success: true, message: 'Semua notifikasi ditandai telah dibaca.' });
  } catch (e) { next(e); }
});

router.patch('/:notifId/read', async (req: AuthRequest, res, next) => {
  try {
    await notifService.markRead(req.user!.id, req.params.notifId as string);
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
