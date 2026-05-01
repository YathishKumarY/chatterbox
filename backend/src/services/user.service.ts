import { prisma } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import { getContactStatusMap } from './contact.service.js';

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, username: true, avatarUrl: true, avatarData: true, isOnline: true, lastSeen: true, createdAt: true },
  });
  if (!user) throw new NotFoundError('User not found');
  return user;
}

export async function searchUsers(query: string, currentUserId: string) {
  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: currentUserId } },
        {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
      ],
    },
    select: { id: true, username: true, email: true, avatarUrl: true, isOnline: true, lastSeen: true },
    take: 20,
  });

  const statusMap = await getContactStatusMap(currentUserId, users.map(u => u.id));
  return users.map(u => ({ ...u, contactStatus: statusMap.get(u.id) ?? null }));
}

export async function updateUser(id: string, data: { username?: string; avatarUrl?: string; avatarData?: string | null }) {
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, username: true, avatarUrl: true, avatarData: true },
  });
}

export async function setOnlineStatus(userId: string, isOnline: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: { isOnline, lastSeen: new Date() },
  });
}
