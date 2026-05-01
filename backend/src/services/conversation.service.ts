import { prisma } from '../config/database.js';
import { ForbiddenError, NotFoundError, ConflictError } from '../utils/errors.js';
import { areAllContacts } from './contact.service.js';

const userSelect = { id: true, username: true, avatarUrl: true, isOnline: true, lastSeen: true } as const;
const conversationInclude = {
  participants: { include: { user: { select: userSelect } } },
} as const;

export async function createConversation(
  creatorId: string,
  data: { participantIds: string[]; name?: string; isGroup?: boolean },
) {
  const allParticipantIds = [...new Set([creatorId, ...data.participantIds])];
  const otherIds = allParticipantIds.filter(id => id !== creatorId);

  if (otherIds.length > 0) {
    const allContacts = await areAllContacts(creatorId, otherIds);
    if (!allContacts) {
      throw new ForbiddenError('All participants must be your contacts');
    }
  }

  const isGroup = data.isGroup ?? allParticipantIds.length > 2;

  // For 1:1 conversations, atomically check-or-create within a transaction
  // to avoid duplicate DM creation under concurrent requests.
  if (!isGroup && allParticipantIds.length === 2) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.conversation.findFirst({
        where: {
          isGroup: false,
          AND: allParticipantIds.map(id => ({
            participants: { some: { userId: id } },
          })),
        },
        include: conversationInclude,
      });
      if (existing) return existing;

      return tx.conversation.create({
        data: {
          name: data.name,
          isGroup: false,
          createdBy: creatorId,
          participants: {
            create: allParticipantIds.map(userId => ({
              userId,
              role: userId === creatorId ? 'admin' : 'member',
            })),
          },
        },
        include: conversationInclude,
      });
    });
  }

  return prisma.conversation.create({
    data: {
      name: data.name,
      isGroup,
      createdBy: creatorId,
      participants: {
        create: allParticipantIds.map(userId => ({
          userId,
          role: userId === creatorId ? 'admin' : 'member',
        })),
      },
    },
    include: conversationInclude,
  });
}

export async function getUserConversations(userId: string) {
  const myParticipants = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: {
      conversationId: true,
      unreadCount: true,
      lastMessageAt: true,
      lastMessagePreview: true,
      lastMessageSenderId: true,
    },
  });

  const convIds = myParticipants.map(p => p.conversationId);
  if (convIds.length === 0) return [];

  const denormMap = new Map(myParticipants.map(p => [p.conversationId, p]));

  const conversations = await prisma.conversation.findMany({
    where: { id: { in: convIds } },
    include: conversationInclude,
    orderBy: { updatedAt: 'desc' },
  });

  return conversations.map(conv => {
    const denorm = denormMap.get(conv.id)!;
    return {
      ...conv,
      unreadCount: denorm.unreadCount,
      lastMessage: denorm.lastMessageAt
        ? {
            content: denorm.lastMessagePreview || '',
            createdAt: denorm.lastMessageAt.toISOString(),
            senderId: denorm.lastMessageSenderId,
          }
        : null,
    };
  });
}

export async function getConversation(id: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: conversationInclude,
  });

  if (!conversation) throw new NotFoundError('Conversation not found');

  const isMember = conversation.participants.some(p => p.userId === userId);
  if (!isMember) throw new ForbiddenError('Not a member of this conversation');

  return conversation;
}

export async function addParticipant(conversationId: string, userId: string, requesterId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });

  if (!conversation) throw new NotFoundError('Conversation not found');
  if (!conversation.isGroup) throw new ForbiddenError('Cannot add participants to 1-on-1 chat');

  const requester = conversation.participants.find(p => p.userId === requesterId);
  if (!requester || requester.role !== 'admin') throw new ForbiddenError('Only admins can add participants');

  const alreadyMember = conversation.participants.some(p => p.userId === userId);
  if (alreadyMember) throw new ConflictError('User is already a member');

  const isContact = await areAllContacts(requesterId, [userId]);
  if (!isContact) throw new ForbiddenError('You can only add your contacts to groups');

  return prisma.conversationParticipant.create({
    data: { conversationId, userId },
    include: { user: { select: userSelect } },
  });
}

export async function removeParticipant(conversationId: string, userId: string, requesterId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });

  if (!conversation) throw new NotFoundError('Conversation not found');
  if (!conversation.isGroup) throw new ForbiddenError('Cannot remove participants from 1-on-1 chat');

  const requester = conversation.participants.find(p => p.userId === requesterId);
  const isAdmin = requester?.role === 'admin';
  const isSelf = userId === requesterId;

  if (!isAdmin && !isSelf) throw new ForbiddenError('Only admins can remove other participants');

  return prisma.conversationParticipant.delete({
    where: { userId_conversationId: { userId, conversationId } },
  });
}
