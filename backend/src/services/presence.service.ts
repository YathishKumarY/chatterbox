import { getRedisClient } from '../config/redis.js';

const PRESENCE_TTL = 30;
const SOCKET_KEY = (userId: string) => `user:${userId}:sockets`;
const PRESENCE_KEY = (userId: string) => `presence:${userId}`;

const localUserSockets = new Map<string, Set<string>>();

export async function addUserSocket(userId: string, socketId: string) {
  const redis = getRedisClient();
  if (redis) {
    await redis.sadd(SOCKET_KEY(userId), socketId);
    await redis.set(PRESENCE_KEY(userId), '1', 'EX', PRESENCE_TTL);
  } else {
    if (!localUserSockets.has(userId)) {
      localUserSockets.set(userId, new Set());
    }
    localUserSockets.get(userId)!.add(socketId);
  }
}

export async function removeUserSocket(userId: string, socketId: string): Promise<boolean> {
  const redis = getRedisClient();
  if (redis) {
    await redis.srem(SOCKET_KEY(userId), socketId);
    const remaining = await redis.scard(SOCKET_KEY(userId));
    if (remaining === 0) {
      await redis.del(PRESENCE_KEY(userId));
      await redis.del(SOCKET_KEY(userId));
      return true;
    }
    return false;
  } else {
    const sockets = localUserSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        localUserSockets.delete(userId);
        return true;
      }
    }
    return false;
  }
}

export async function isUserOnline(userId: string): Promise<boolean> {
  const redis = getRedisClient();
  if (redis) {
    const present = await redis.exists(PRESENCE_KEY(userId));
    return present === 1;
  } else {
    const sockets = localUserSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }
}

export async function getUserSocketIds(userId: string): Promise<string[]> {
  const redis = getRedisClient();
  if (redis) {
    return redis.smembers(SOCKET_KEY(userId));
  } else {
    const sockets = localUserSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }
}

export async function refreshHeartbeat(userId: string) {
  const redis = getRedisClient();
  if (redis) {
    await redis.set(PRESENCE_KEY(userId), '1', 'EX', PRESENCE_TTL);
  }
}

export async function cleanupUser(userId: string) {
  const redis = getRedisClient();
  if (redis) {
    await redis.del(SOCKET_KEY(userId));
    await redis.del(PRESENCE_KEY(userId));
  } else {
    localUserSockets.delete(userId);
  }
}
