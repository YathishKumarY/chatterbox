import { prisma } from '../config/database.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../utils/errors.js';

const userSelect = { id: true, username: true, email: true, avatarUrl: true, isOnline: true, lastSeen: true };

export async function sendRequest(requesterId: string, addresseeId: string) {
  if (requesterId === addresseeId) {
    throw new ValidationError('Cannot send a contact request to yourself');
  }

  const addressee = await prisma.user.findUnique({ where: { id: addresseeId } });
  if (!addressee) throw new NotFoundError('User not found');

  const existing = await prisma.contact.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    },
  });

  if (existing) {
    if (existing.status === 'accepted') {
      throw new ConflictError('Already contacts');
    }
    if (existing.requesterId === requesterId && existing.status === 'pending') {
      throw new ConflictError('Request already sent');
    }
    if (existing.requesterId === addresseeId && existing.status === 'pending') {
      return prisma.contact.update({
        where: { id: existing.id },
        data: { status: 'accepted' },
        include: { requester: { select: userSelect }, addressee: { select: userSelect } },
      });
    }
    if (existing.requesterId === requesterId && existing.status === 'rejected') {
      return prisma.contact.update({
        where: { id: existing.id },
        data: { status: 'pending' },
        include: { requester: { select: userSelect }, addressee: { select: userSelect } },
      });
    }
  }

  return prisma.contact.create({
    data: { requesterId, addresseeId },
    include: { requester: { select: userSelect }, addressee: { select: userSelect } },
  });
}

export async function respondToRequest(addresseeId: string, contactId: string, accept: boolean) {
  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact || contact.addresseeId !== addresseeId) {
    throw new NotFoundError('Contact request not found');
  }
  if (contact.status !== 'pending') {
    throw new ConflictError('Request already handled');
  }

  return prisma.contact.update({
    where: { id: contactId },
    data: { status: accept ? 'accepted' : 'rejected' },
    include: { requester: { select: userSelect }, addressee: { select: userSelect } },
  });
}

export async function getIncomingRequests(userId: string) {
  return prisma.contact.findMany({
    where: { addresseeId: userId, status: 'pending' },
    include: { requester: { select: userSelect } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getContacts(userId: string) {
  const contacts = await prisma.contact.findMany({
    where: {
      status: 'accepted',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: { requester: { select: userSelect }, addressee: { select: userSelect } },
  });

  return contacts.map(c => c.requesterId === userId ? c.addressee : c.requester);
}

export async function areContacts(userId1: string, userId2: string): Promise<boolean> {
  const count = await prisma.contact.count({
    where: {
      status: 'accepted',
      OR: [
        { requesterId: userId1, addresseeId: userId2 },
        { requesterId: userId2, addresseeId: userId1 },
      ],
    },
  });
  return count > 0;
}

export async function areAllContacts(userId: string, otherUserIds: string[]): Promise<boolean> {
  if (otherUserIds.length === 0) return true;
  const count = await prisma.contact.count({
    where: {
      status: 'accepted',
      OR: [
        { requesterId: userId, addresseeId: { in: otherUserIds } },
        { addresseeId: userId, requesterId: { in: otherUserIds } },
      ],
    },
  });
  return count >= otherUserIds.length;
}

export async function removeContact(userId: string, contactId: string) {
  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) throw new NotFoundError('Contact not found');
  if (contact.requesterId !== userId && contact.addresseeId !== userId) {
    throw new ForbiddenError('Not your contact');
  }
  if (contact.status !== 'accepted') {
    throw new ConflictError('Not an accepted contact');
  }
  await prisma.contact.delete({ where: { id: contactId } });
}

export async function getContactStatusMap(userId: string, otherUserIds: string[]) {
  if (otherUserIds.length === 0) return new Map<string, string>();

  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { requesterId: userId, addresseeId: { in: otherUserIds } },
        { addresseeId: userId, requesterId: { in: otherUserIds } },
      ],
    },
  });

  const statusMap = new Map<string, string>();
  for (const c of contacts) {
    const otherId = c.requesterId === userId ? c.addresseeId : c.requesterId;
    if (c.status === 'accepted') {
      statusMap.set(otherId, 'contact');
    } else if (c.status === 'pending') {
      statusMap.set(otherId, c.requesterId === userId ? 'pending_outgoing' : 'pending_incoming');
    }
  }
  return statusMap;
}
