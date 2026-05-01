import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as conversationService from '../services/conversation.service.js';
import { getIO } from '../socket/index.js';
import * as presenceService from '../services/presence.service.js';

const router = Router();

router.use(authenticate);

const createSchema = z.object({
  body: z.object({
    participantIds: z.array(z.string().uuid()).min(1),
    name: z.string().optional(),
    isGroup: z.boolean().optional(),
  }),
});

router.post('/', validate(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await conversationService.createConversation(req.user!.userId, req.body);

    const io = getIO();
    if (io) {
      for (const p of conversation.participants) {
        const socketIds = await presenceService.getUserSocketIds(p.userId);
        for (const sid of socketIds) {
          io.in(sid).socketsJoin(`conversation:${conversation.id}`);
        }
        if (socketIds.length > 0) {
          for (const sid of socketIds) {
            io.to(sid).emit('conversation:created', conversation);
          }
        }
      }
    }

    res.status(201).json(conversation);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversations = await conversationService.getUserConversations(req.user!.userId);
    res.json(conversations);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const conversation = await conversationService.getConversation(req.params.id, req.user!.userId);
    res.json(conversation);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/participants', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const participant = await conversationService.addParticipant(
      req.params.id,
      req.body.userId,
      req.user!.userId,
    );
    res.status(201).json(participant);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/participants/:userId', async (req: Request<{ id: string; userId: string }>, res: Response, next: NextFunction) => {
  try {
    await conversationService.removeParticipant(req.params.id, req.params.userId, req.user!.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { name, avatarUrl, avatarData } = req.body;
    const conversation = await conversationService.updateGroup(req.params.id, req.user!.userId, { name, avatarUrl, avatarData });
    res.json(conversation);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/participants/:userId/role', async (req: Request<{ id: string; userId: string }>, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    const participant = await conversationService.updateParticipantRole(req.params.id, req.params.userId, req.user!.userId, role);
    res.json(participant);
  } catch (err) {
    next(err);
  }
});

export default router;
