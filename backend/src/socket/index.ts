import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';
import type { JwtPayload } from '../middleware/auth.js';
import { registerMessageHandlers } from './handlers/message.handler.js';
import { registerTypingHandlers } from './handlers/typing.handler.js';
import { registerPresenceHandlers } from './handlers/presence.handler.js';
import * as presenceService from '../services/presence.service.js';
import { startDeliveryWorker, drainUserQueue } from '../queues/message-delivery.queue.js';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedisClient } from '../config/redis.js';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  email: string;
  deviceId?: string;
}

const HEARTBEAT_INTERVAL = 10_000;

let ioInstance: Server | null = null;

export function getIO(): Server | null {
  return ioInstance;
}

export function initializeSocket(httpServer: HttpServer) {
  const isDev = env.NODE_ENV !== 'production';
  const lanRegex = /^https?:\/\/192\.168\.\d+\.\d+:\d+$/;

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin === env.CORS_ORIGIN || (isDev && lanRegex.test(origin))) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const redis = getRedisClient();
  if (redis) {
    const pubClient = redis.duplicate();
    const subClient = redis.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter attached');
  }

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      (socket as AuthenticatedSocket).userId = payload.userId;
      (socket as AuthenticatedSocket).email = payload.email;
      (socket as AuthenticatedSocket).deviceId = socket.handshake.auth.deviceId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  startDeliveryWorker(io);

  io.on('connection', async (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const { userId } = socket;

    logger.info({ userId, socketId: socket.id }, 'User connected');

    await presenceService.addUserSocket(userId, socket.id);

    const conversations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    for (const conv of conversations) {
      socket.join(`conversation:${conv.conversationId}`);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeen: new Date() },
    });

    socket.broadcast.emit('user:online', { userId });

    drainUserQueue(userId, io);

    const heartbeat = setInterval(() => {
      presenceService.refreshHeartbeat(userId);
    }, HEARTBEAT_INTERVAL);

    registerMessageHandlers(io, socket);
    registerTypingHandlers(io, socket);
    registerPresenceHandlers(io, socket);

    socket.on('conversation:join', async (data: { conversationId: string }) => {
      const participant = await prisma.conversationParticipant.findUnique({
        where: { userId_conversationId: { userId, conversationId: data.conversationId } },
      });
      if (participant) {
        socket.join(`conversation:${data.conversationId}`);
      }
    });

    socket.on('disconnect', async () => {
      logger.info({ userId, socketId: socket.id }, 'User disconnected');
      clearInterval(heartbeat);

      const wasLast = await presenceService.removeUserSocket(userId, socket.id);
      if (wasLast) {
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: false, lastSeen: new Date() },
        });
        socket.broadcast.emit('user:offline', { userId, lastSeen: new Date() });
      }
    });
  });

  ioInstance = io;

  return io;
}
