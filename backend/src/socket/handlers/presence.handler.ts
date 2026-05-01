import { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../index.js';
import * as presenceService from '../../services/presence.service.js';

export function registerPresenceHandlers(_io: Server, socket: AuthenticatedSocket) {
  socket.on('presence:check', async (data: { userIds: string[] }, ack) => {
    const statuses = await Promise.all(
      data.userIds.map(async (id) => ({
        userId: id,
        isOnline: await presenceService.isUserOnline(id),
      })),
    );

    if (typeof ack === 'function') {
      ack({ statuses });
    }
  });
}
