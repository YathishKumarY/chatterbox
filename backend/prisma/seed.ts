import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    throw new Error(
      'Refusing to run seed in production. Set ALLOW_PROD_SEED=true to override.',
    );
  }

  await prisma.contact.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.messageStatus.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 12);

  const alice = await prisma.user.create({
    data: { email: 'alice@example.com', username: 'alice', passwordHash },
  });

  const bob = await prisma.user.create({
    data: { email: 'bob@example.com', username: 'bob', passwordHash },
  });

  const charlie = await prisma.user.create({
    data: { email: 'charlie@example.com', username: 'charlie', passwordHash },
  });

  const diana = await prisma.user.create({
    data: { email: 'diana@example.com', username: 'diana', passwordHash },
  });

  await prisma.contact.create({ data: { requesterId: alice.id, addresseeId: bob.id, status: 'accepted' } });
  await prisma.contact.create({ data: { requesterId: alice.id, addresseeId: charlie.id, status: 'accepted' } });
  await prisma.contact.create({ data: { requesterId: alice.id, addresseeId: diana.id, status: 'accepted' } });
  await prisma.contact.create({ data: { requesterId: bob.id, addresseeId: charlie.id, status: 'accepted' } });
  await prisma.contact.create({ data: { requesterId: bob.id, addresseeId: diana.id, status: 'accepted' } });
  await prisma.contact.create({ data: { requesterId: charlie.id, addresseeId: diana.id, status: 'accepted' } });

  const dmConv = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [
          { userId: alice.id, role: 'member' },
          { userId: bob.id, role: 'member' },
        ],
      },
    },
  });

  const groupConv = await prisma.conversation.create({
    data: {
      name: 'Team Chat',
      isGroup: true,
      createdBy: alice.id,
      participants: {
        create: [
          { userId: alice.id, role: 'admin' },
          { userId: bob.id, role: 'member' },
          { userId: charlie.id, role: 'member' },
          { userId: diana.id, role: 'member' },
        ],
      },
    },
  });

  const messages = [
    { conv: dmConv.id, sender: alice.id, other: bob.id, content: 'Hey Bob! How are you?' },
    { conv: dmConv.id, sender: bob.id, other: alice.id, content: 'Hi Alice! I\'m doing great, thanks!' },
    { conv: dmConv.id, sender: alice.id, other: bob.id, content: 'Want to grab coffee later?' },
    { conv: dmConv.id, sender: bob.id, other: alice.id, content: 'Sure, 3pm works for me!' },
    { conv: groupConv.id, sender: alice.id, content: 'Welcome everyone to the team chat!' },
    { conv: groupConv.id, sender: bob.id, content: 'Thanks for creating this group' },
    { conv: groupConv.id, sender: charlie.id, content: 'Hey all! Excited to be here' },
  ];

  for (const msg of messages) {
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId: msg.conv, userId: { not: msg.sender } },
    });

    const now = new Date();
    const preview = msg.content.slice(0, 100);

    await prisma.message.create({
      data: {
        conversationId: msg.conv,
        senderId: msg.sender,
        content: msg.content,
        statuses: {
          create: otherParticipants.map(p => ({
            userId: p.userId,
            status: 'delivered',
          })),
        },
      },
    });

    await prisma.conversation.update({
      where: { id: msg.conv },
      data: { updatedAt: now },
    });

    await prisma.conversationParticipant.updateMany({
      where: { conversationId: msg.conv },
      data: { lastMessageAt: now, lastMessagePreview: preview, lastMessageSenderId: msg.sender },
    });
  }

  console.log('Seed complete!');
  console.log('Demo users (password: password123):');
  console.log('  alice@example.com');
  console.log('  bob@example.com');
  console.log('  charlie@example.com');
  console.log('  diana@example.com');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
