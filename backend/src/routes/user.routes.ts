import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as userService from '../services/user.service.js';

const router = Router();

router.use(authenticate);

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.user!.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.patch('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, avatarUrl } = req.body;
    const user = await userService.updateUser(req.user!.userId, { username, avatarUrl });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) || '';
    const users = await userService.searchUsers(q, req.user!.userId);
    res.json(users);
  } catch (err) {
    next(err);
  }
});

export default router;
