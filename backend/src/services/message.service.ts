import { prisma } from '../config/database.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  clientMessageId?: string,
) {
  if (clientMessageId) {
    const existing = await prisma.message.findUnique({
      where: { clientMessageId },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
        statuses: true,
      },
    });
    if (existing) return existing;
  }

  const participant = await prisma.conversationParticipant.findUnique({
    where: { userId_conversationId: { userId: senderId, conversationId } },
  });
  if (!participant) throw new ForbiddenError('Not a member of this conversation');

  const otherParticipants = await prisma.conversationParticipant.findMany({
    where: { conversationId, userId: { not: senderId } },
  });

  try {
    const now = new Date();
    const preview = content.slice(0, 100);

    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId,
          content,
          clientMessageId,
          statuses: {
            create: otherParticipants.map(p => ({
              userId: p.userId,
              status: 'sent',
            })),
          },
        },
        include: {
          sender: { select: { id: true, username: true, avatarUrl: true } },
          statuses: true,
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: now },
      });

      await tx.conversationParticipant.updateMany({
        where: { conversationId },
        data: {
          lastMessageAt: now,
          lastMessagePreview: preview,
          lastMessageSenderId: senderId,
        },
      });

      await tx.conversationParticipant.updateMany({
        where: { conversationId, userId: { not: senderId } },
        data: { unreadCount: { increment: 1 } },
      });

      return msg;
    });

    return message;
  } catch (err: any) {
    if (err.code === 'P2002' && clientMessageId) {
      const existing = await prisma.message.findUnique({
        where: { clientMessageId },
        include: {
          sender: { select: { id: true, username: true, avatarUrl: true } },
          statuses: true,
        },
      });
      if (existing) return existing;
    }
    throw err;
  }
}

export async function getMessages(
  conversationId: string,
  userId: string,
  options: { cursor?: string; limit?: number } = {},
) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { userId_conversationId: { userId, conversationId } },
  });
  if (!participant) throw new ForbiddenError('Not a member of this conversation');

  const limit = Math.min(options.limit || 50, 100);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(options.cursor && { cursor: { id: options.cursor }, skip: 1 }),
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true } },
      statuses: true,
    },
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;

  return {
    messages: items.reverse(),
    nextCursor: hasMore ? items[0].id : null,
  };
}

export async function updateMessageStatus(
  messageId: string,
  userId: string,
  status: 'delivered' | 'read',
) {
  const messageStatus = await prisma.messageStatus.findUnique({
    where: { messageId_userId: { messageId, userId } },
  });
  if (!messageStatus) throw new NotFoundError('Message status not found');

  const statusOrder = { sent: 0, delivered: 1, read: 2 };
  if (statusOrder[status] <= statusOrder[messageStatus.status as keyof typeof statusOrder]) {
    return messageStatus;
  }

  return prisma.messageStatus.update({
    where: { messageId_userId: { messageId, userId } },
    data: { status, updatedAt: new Date() },
  });
}

export async function markConversationAsRead(conversationId: string, userId: string) {
  await prisma.$transaction([
    prisma.messageStatus.updateMany({
      where: {
        userId,
        status: { not: 'read' },
        message: { conversationId },
      },
      data: { status: 'read', updatedAt: new Date() },
    }),
    prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { unreadCount: 0 },
    }),
  ]);
}

export async function getUndeliveredMessages(userId: string, limit = 200) {
  const cap = Math.min(Math.max(limit, 1), 500);
  // Fetch newest first, then reverse so caller receives ascending order.
  const recent = await prisma.message.findMany({
    where: {
      statuses: { some: { userId, status: 'sent' } },
      conversation: { participants: { some: { userId } } },
    },
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true } },
      statuses: { where: { userId } },
    },
    orderBy: { createdAt: 'desc' },
    take: cap,
  });
  return recent.reverse();
}
