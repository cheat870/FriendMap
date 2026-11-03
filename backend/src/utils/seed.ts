import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import logger from './logger';

async function seed() {
  logger.info('Starting FriendMap database seeding...');

  try {
    const passwordHash = await bcrypt.hash('Password123!', 12);

    // Seed Admin
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        id: 'usr_admin_001',
        username: 'admin',
        email: 'admin@friendmap.local',
        passwordHash,
        displayName: 'FriendMap Admin',
        role: 'admin',
        status: 'active',
        emailVerified: true,
        bio: 'FriendMap System Administrator',
        settings: {
          create: {
            language: 'km',
            theme: 'light',
            shareLocation: true,
          },
        },
      },
    });

    // Seed User A (Alice - Phnom Penh Central)
    const alice = await prisma.user.upsert({
      where: { username: 'alice' },
      update: {},
      create: {
        id: 'usr_alice_001',
        username: 'alice',
        email: 'alice@friendmap.local',
        passwordHash,
        displayName: 'Alice Chen',
        role: 'user',
        status: 'active',
        emailVerified: true,
        bio: 'Exploring the city 🌟',
        location: {
          create: {
            latitude: 11.5564,
            longitude: 104.9282,
            accuracy: 8.5,
            heading: 90,
            speed: 0,
          },
        },
        settings: {
          create: {
            language: 'km',
            theme: 'light',
            shareLocation: true,
            locationHistoryEnabled: true,
          },
        },
      },
    });

    // Seed User B (Bob - Riverside Phnom Penh)
    const bob = await prisma.user.upsert({
      where: { username: 'bob' },
      update: {},
      create: {
        id: 'usr_bob_001',
        username: 'bob',
        email: 'bob@friendmap.local',
        passwordHash,
        displayName: 'Bob Martinez',
        role: 'user',
        status: 'active',
        emailVerified: true,
        bio: 'Coffee & road trips 🚗☕',
        location: {
          create: {
            latitude: 11.5684,
            longitude: 104.9312,
            accuracy: 10.0,
            heading: 180,
            speed: 3.5,
          },
        },
        settings: {
          create: {
            language: 'km',
            theme: 'light',
            shareLocation: true,
            locationHistoryEnabled: true,
          },
        },
      },
    });

    // Seed User C (Charlie - BKK1)
    const charlie = await prisma.user.upsert({
      where: { username: 'charlie' },
      update: {},
      create: {
        id: 'usr_charlie_001',
        username: 'charlie',
        email: 'charlie@friendmap.local',
        passwordHash,
        displayName: 'Charlie Kim',
        role: 'user',
        status: 'active',
        emailVerified: true,
        bio: 'Cyclist & Techie 🚴💻',
        location: {
          create: {
            latitude: 11.5492,
            longitude: 104.9248,
            accuracy: 5.2,
            heading: 45,
            speed: 5.2,
          },
        },
        settings: {
          create: {
            language: 'en',
            theme: 'dark',
            shareLocation: true,
          },
        },
      },
    });

    // Create Friendships: Alice <-> Bob, Alice <-> Charlie
    const uidA = alice.id < bob.id ? alice.id : bob.id;
    const uidB = alice.id < bob.id ? bob.id : alice.id;
    await prisma.friendship.upsert({
      where: { userId1_userId2: { userId1: uidA, userId2: uidB } },
      update: {},
      create: { userId1: uidA, userId2: uidB },
    });

    const uidA2 = alice.id < charlie.id ? alice.id : charlie.id;
    const uidC2 = alice.id < charlie.id ? charlie.id : alice.id;
    await prisma.friendship.upsert({
      where: { userId1_userId2: { userId1: uidA2, userId2: uidC2 } },
      update: {},
      create: { userId1: uidA2, userId2: uidC2 },
    });

    // Create mutual Location Sharing Permissions
    const permissions = [
      { ownerId: alice.id, viewerId: bob.id },
      { ownerId: bob.id, viewerId: alice.id },
      { ownerId: alice.id, viewerId: charlie.id },
      { ownerId: charlie.id, viewerId: alice.id },
    ];

    for (const p of permissions) {
      await prisma.locationSharingPermission.upsert({
        where: { ownerId_viewerId: { ownerId: p.ownerId, viewerId: p.viewerId } },
        update: { isActive: true },
        create: { ownerId: p.ownerId, viewerId: p.viewerId, isActive: true, shareMode: 'always' },
      });
    }

    // Create direct conversation between Alice and Bob
    const existingConv = await prisma.conversation.findFirst({
      where: {
        type: 'direct',
        AND: [
          { members: { some: { userId: alice.id } } },
          { members: { some: { userId: bob.id } } },
        ],
      },
    });

    if (!existingConv) {
      const conv = await prisma.conversation.create({
        data: {
          type: 'direct',
          createdBy: alice.id,
          lastMessageAt: new Date(),
          members: {
            create: [{ userId: alice.id }, { userId: bob.id }],
          },
          messages: {
            create: [
              { senderId: alice.id, content: 'Hey Bob! Are you at the cafe?' },
              { senderId: bob.id, content: 'Yes! Just ordered. You can see me on FriendMap!' },
              { senderId: alice.id, content: 'Great, starting navigation now!' },
            ],
          },
        },
      });
      logger.info(`Seeded conversation with messages: ${conv.id}`);
    }

    logger.info('Database seeded successfully!');
    logger.info('Accounts created:');
    logger.info('1. admin@friendmap.local / Password123! (Admin)');
    logger.info('2. alice@friendmap.local / Password123! (User)');
    logger.info('3. bob@friendmap.local / Password123! (User)');
    logger.info('4. charlie@friendmap.local / Password123! (User)');
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
