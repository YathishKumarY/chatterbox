import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as pushService from '../services/push.service.js';

const router = Router();

router.get('/vapid-public-key', (_req: Request, res: Response) => {
  const key = pushService.getVapidPublicKey();
  if (!key) {
    res.status(404).json({ error: 'Push notifications not configured' });
    return;
  }
  res.json({ key });
});

router.use(authenticate);

const subscribeSchema = z.object({
  body: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});

router.post(
  '/subscribe',
  validate(subscribeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await pushService.subscribe(req.user!.userId, req.body);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);

const unsubscribeSchema = z.object({
  body: z.object({
    endpoint: z.string().url(),
  }),
});

router.post(
  '/unsubscribe',
  validate(unsubscribeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await pushService.unsubscribe(req.body.endpoint);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
