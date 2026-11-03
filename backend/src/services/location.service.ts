import { PrismaClient } from '@prisma/client';

/**
 * Calculate haversine distance between two coordinates in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a location record is considered fresh
 */
export function isLocationFresh(recordedAt: Date, maxAgeSeconds = 7 * 24 * 3600): boolean {
  const ageMs = Date.now() - new Date(recordedAt).getTime();
  return ageMs <= maxAgeSeconds * 1000;
}

/**
 * Check if viewerId has permission to see ownerId's location
 */
export async function checkSharingPermission(
  ownerId: string,
  viewerId: string,
  prisma: PrismaClient
): Promise<boolean> {
  if (ownerId === viewerId) return true;

  // Check if they are friends
  const uid1 = ownerId < viewerId ? ownerId : viewerId;
  const uid2 = ownerId < viewerId ? viewerId : ownerId;

  const friendship = await prisma.friendship.findUnique({
    where: { userId1_userId2: { userId1: uid1, userId2: uid2 } },
  });
  if (!friendship) return false;

  // Check for blocks
  const block = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: ownerId, blockedId: viewerId },
        { blockerId: viewerId, blockedId: ownerId },
      ],
    },
  });
  if (block) return false;

  // Check sharing permission
  const permission = await prisma.locationSharingPermission.findUnique({
    where: { ownerId_viewerId: { ownerId, viewerId } },
  });

  if (permission) {
    if (permission.isActive === false) return false;
    if (permission.expiresAt && new Date(permission.expiresAt) < new Date()) return false;
  }

  // By default, approved friendships share location
  return true;
}

/**
 * Get all friends' locations that the user has valid permission to view
 */
export async function getAuthorizedFriendsLocations(
  userId: string,
  prisma: PrismaClient
): Promise<
  Array<{
    friend: any;
    location: any;
    permission: any;
  }>
> {
  const MAX_AGE_SECONDS = parseInt(
    process.env.LOCATION_MAX_AGE_SECONDS || (7 * 24 * 3600).toString(),
    10
  );

  // Get all friendships
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ userId1: userId }, { userId2: userId }],
    },
    include: {
      user1: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          lastActiveAt: true,
          status: true,
        },
      },
      user2: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          lastActiveAt: true,
          status: true,
        },
      },
    },
  });

  const friendIds = friendships.map((f) => (f.userId1 === userId ? f.userId2 : f.userId1));
  const friends = friendships.map((f) => (f.userId1 === userId ? f.user2 : f.user1));

  if (friendIds.length === 0) return [];

  // Check for blocks
  const blocks = await prisma.blockedUser.findMany({
    where: {
      OR: [
        { blockerId: userId, blockedId: { in: friendIds } },
        { blockerId: { in: friendIds }, blockedId: userId },
      ],
    },
  });
  const blockedIds = new Set([
    ...blocks.map((b) => b.blockedId),
    ...blocks.map((b) => b.blockerId),
  ]);

  // Get sharing permissions (friends sharing with us)
  const permissions = await prisma.locationSharingPermission.findMany({
    where: {
      ownerId: { in: friendIds },
      viewerId: userId,
    },
  });

  const permissionMap = new Map(permissions.map((p) => [p.ownerId, p]));
  const now = new Date();

  // Friends are authorized unless blocked or permission is explicitly disabled/expired
  const authorizedIds = friendIds.filter((friendId) => {
    if (blockedIds.has(friendId)) return false;
    const p = permissionMap.get(friendId);
    if (p) {
      if (p.isActive === false) return false;
      if (p.expiresAt && new Date(p.expiresAt) < now) return false;
    }
    return true;
  });

  if (authorizedIds.length === 0) return [];

  const locations = await prisma.location.findMany({
    where: { userId: { in: authorizedIds } },
  });

  const locationMap = new Map(locations.map((l) => [l.userId, l]));
  const friendMap = new Map(friends.map((f) => [f.id, f]));

  return authorizedIds
    .map((friendId) => {
      const location = locationMap.get(friendId);
      if (!location) return null;
      if (!isLocationFresh(location.recordedAt, MAX_AGE_SECONDS)) return null;

      return {
        friend: friendMap.get(friendId),
        location,
        permission: permissionMap.get(friendId) || { isActive: true, shareMode: 'always' },
      };
    })
    .filter(Boolean) as Array<{ friend: any; location: any; permission: any }>;
}
