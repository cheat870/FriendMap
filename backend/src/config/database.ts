import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

declare global {
  // Allow global var in Node.js development hot-reload
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
    errorFormat: 'minimal',
  });
}

const prisma: PrismaClient =
  process.env.NODE_ENV === 'production'
    ? createPrismaClient()
    : (global.__prisma ?? (global.__prisma = createPrismaClient()));

// Log slow queries in development
if (process.env.NODE_ENV !== 'production') {
  (prisma as any).$on('query', (e: any) => {
    if (e.duration > 200) {
      logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}

(prisma as any).$on('error', (e: any) => {
  logger.error('Prisma error:', e);
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Auto-fix: ensure all existing friendships have active sharing by default
    try {
      const updateResult = await prisma.locationSharingPermission.updateMany({
        where: { isActive: false },
        data: { isActive: true },
      });
      if (updateResult.count > 0) {
        logger.info(`Auto-enabled location sharing for ${updateResult.count} existing friend permissions`);
      }
    } catch (e) {
      logger.warn('Failed to auto-enable permissions on startup:', e);
    }
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

export default prisma;
