import { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../index.js';

const typingTimeouts = new Map<string, NodeJS.Timeout>();

export function registerTypingHandlers(io: Server, socket: AuthenticatedSocket) {
  socket.on('typing:start', (data: { conversationId: string }) => {
    const key = `${socket.userId}:${data.conversationId}`;

    const existing = typingTimeouts.get(key);
    if (existing) clearTimeout(existing);

    socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
      userId: socket.userId,
      conversationId: data.conversationId,
    });

    const timeout = setTimeout(() => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
        userId: socket.userId,
        conversationId: data.conversationId,
      });
      typingTimeouts.delete(key);
    }, 3000);

    typingTimeouts.set(key, timeout);
  });

  socket.on('typing:stop', (data: { conversationId: string }) => {
    const key = `${socket.userId}:${data.conversationId}`;
    const existing = typingTimeouts.get(key);
    if (existing) {
      clearTimeout(existing);
      typingTimeouts.delete(key);
    }

    socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
      userId: socket.userId,
      conversationId: data.conversationId,
    });
  });

  socket.on('disconnect', () => {
    for (const [key, timeout] of typingTimeouts) {
      if (key.startsWith(`${socket.userId}:`)) {
        clearTimeout(timeout);
        typingTimeouts.delete(key);
      }
    }
  });
}
