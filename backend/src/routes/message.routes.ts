import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as messageService from '../services/message.service.js';

const router = Router();

router.use(authenticate);

const sendSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(5000),
    clientMessageId: z.string().uuid().optional(),
  }),
  params: z.object({ conversationId: z.string().uuid() }),
});

router.post(
  '/:conversationId/messages',
  validate(sendSchema),
  async (req: Request<{ conversationId: string }>, res: Response, next: NextFunction) => {
    try {
      const message = await messageService.sendMessage(
        req.params.conversationId,
        req.user!.userId,
        req.body.content,
        req.body.clientMessageId,
      );
      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  },
);

router.get('/:conversationId/messages', async (req: Request<{ conversationId: string }>, res: Response, next: NextFunction) => {
  try {
    const { cursor, limit } = req.query;
    const result = await messageService.getMessages(req.params.conversationId, req.user!.userId, {
      cursor: cursor as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
