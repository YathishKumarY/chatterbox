import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as contactService from '../services/contact.service.js';
import { getIO } from '../socket/index.js';
import * as presenceService from '../services/presence.service.js';

const router = Router();

router.use(authenticate);

const sendRequestSchema = z.object({
  body: z.object({ addresseeId: z.string().uuid() }),
});

const respondSchema = z.object({
  body: z.object({ accept: z.boolean() }),
});

router.post('/', validate(sendRequestSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contact = await contactService.sendRequest(req.user!.userId, req.body.addresseeId);

    const io = getIO();
    if (io) {
      const socketIds = await presenceService.getUserSocketIds(contact.addresseeId);
      for (const sid of socketIds) {
        io.to(sid).emit('contact:request', {
          id: contact.id,
          status: contact.status,
          requester: contact.requester,
        });
      }

      if (contact.status === 'accepted') {
        const requesterSocketIds = await presenceService.getUserSocketIds(contact.requesterId);
        for (const sid of requesterSocketIds) {
          io.to(sid).emit('contact:accepted', {
            id: contact.id,
            user: contact.addressee,
          });
        }
      }
    }

    res.status(201).json(contact);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contacts = await contactService.getContacts(req.user!.userId);
    res.json(contacts);
  } catch (err) {
    next(err);
  }
});

router.get('/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await contactService.getIncomingRequests(req.user!.userId);
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', validate(respondSchema), async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const contact = await contactService.respondToRequest(req.user!.userId, req.params.id, req.body.accept);

    if (contact.status === 'accepted') {
      const io = getIO();
      if (io) {
        const requesterSocketIds = await presenceService.getUserSocketIds(contact.requesterId);
        for (const sid of requesterSocketIds) {
          io.to(sid).emit('contact:accepted', {
            id: contact.id,
            user: contact.addressee,
          });
        }
      }
    }

    res.json(contact);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    await contactService.removeContact(req.user!.userId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
