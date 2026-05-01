import { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../index.js';
import * as messageService from '../../services/message.service.js';
import { logger } from '../../utils/logger.js';
import * as presenceService from '../../services/presence.service.js';
import { prisma } from '../../config/database.js';
import { enqueueDelivery } from '../../queues/message-delivery.queue.js';
import { sendPushToUser } from '../../services/push.service.js';

export function registerMessageHandlers(io: Server, socket: AuthenticatedSocket) {
  socket.on('message:send', async (data: { conversationId: string; content: string; clientMessageId?: string }, ack) => {
    try {
      const message = await messageService.sendMessage(data.conversationId, socket.userId, data.content, data.clientMessageId);

      socket.to(`conversation:${data.conversationId}`).emit('message:new', message);

      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId: data.conversationId, userId: { not: socket.userId } },
        select: { userId: true },
      });
      for (const p of participants) {
        const online = await presenceService.isUserOnline(p.userId);
        if (!online) {
          enqueueDelivery(p.userId, message);
          sendPushToUser(p.userId, {
            title: message.sender.username,
            body: message.content.slice(0, 200),
            conversationId: data.conversationId,
          });
        }
      }

      if (typeof ack === 'function') {
        ack({ success: true, message });
      }
    } catch (err) {
      logger.error(err, 'Error sending message');
      if (typeof ack === 'function') {
        ack({ success: false, error: (err as Error).message });
      }
    }
  });

  socket.on('message:delivered', async (data: { messageId: string }, ack) => {
    try {
      const status = await messageService.updateMessageStatus(data.messageId, socket.userId, 'delivered');

      const message = await prisma.message.findUnique({ where: { id: data.messageId }, select: { senderId: true, conversationId: true } });

      if (message) {
        const senderSocketIds = await presenceService.getUserSocketIds(message.senderId);
        for (const sid of senderSocketIds) {
          io.to(sid).emit('message:status', {
            messageId: data.messageId,
            userId: socket.userId,
            status: 'delivered',
            conversationId: message.conversationId,
          });
        }
      }

      if (typeof ack === 'function') ack({ success: true });
    } catch (err) {
      logger.error(err, 'Error updating delivered status');
      if (typeof ack === 'function') ack({ success: false });
    }
  });

  socket.on('message:read', async (data: { conversationId: string }, ack) => {
    try {
      await messageService.markConversationAsRead(data.conversationId, socket.userId);

      socket.to(`conversation:${data.conversationId}`).emit('message:read', {
        conversationId: data.conversationId,
        userId: socket.userId,
      });

      const mySocketIds = await presenceService.getUserSocketIds(socket.userId);
      for (const sid of mySocketIds) {
        if (sid !== socket.id) {
          io.to(sid).emit('sync:read', { conversationId: data.conversationId });
        }
      }

      if (typeof ack === 'function') ack({ success: true });
    } catch (err) {
      logger.error(err, 'Error marking as read');
      if (typeof ack === 'function') ack({ success: false });
    }
  });

  socket.on('device:sync', async (data: { deviceId: string; lastSyncAt: string }, ack) => {
    try {
      const since = new Date(data.lastSyncAt);
      const conversations = await prisma.conversationParticipant.findMany({
        where: { userId: socket.userId },
        select: { conversationId: true },
      });
      const convIds = conversations.map(c => c.conversationId);

      // Fetch newest 200 first so we never silently drop the most recent ones,
      // then reverse to deliver in chronological order.
      const recent = await prisma.message.findMany({
        where: {
          conversationId: { in: convIds },
          createdAt: { gt: since },
        },
        include: {
          sender: { select: { id: true, username: true, avatarUrl: true } },
          statuses: { where: { userId: socket.userId } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 200,
      });
      const messages = recent.reverse();

      if (typeof ack === 'function') ack({ success: true, messages });
    } catch (err) {
      logger.error(err, 'Error syncing device');
      if (typeof ack === 'function') ack({ success: false });
    }
  });

  socket.on('messages:fetch-undelivered', async (_, ack) => {
    try {
      const messages = await messageService.getUndeliveredMessages(socket.userId);
      if (typeof ack === 'function') ack({ success: true, messages });
    } catch (err) {
      logger.error(err, 'Error fetching undelivered');
      if (typeof ack === 'function') ack({ success: false });
    }
  });
}
