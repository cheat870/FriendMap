import { Request, Response } from 'express';
import prisma from '../config/database';
import {
  checkSharingPermission,
  getAuthorizedFriendsLocations,
  haversineDistance,
} from '../services/location.service';
import logger from '../utils/logger';

export async function updateLocation(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { latitude, longitude, accuracy, altitude, heading, speed } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const now = new Date();

    // Upsert current location
    const location = await prisma.location.upsert({
      where: { userId },
      update: {
        latitude: lat,
        longitude: lng,
        accuracy: accuracy ? parseFloat(accuracy) : null,
        altitude: altitude ? parseFloat(altitude) : null,
        heading: heading ? parseFloat(heading) : null,
        speed: speed ? parseFloat(speed) : null,
        recordedAt: now,
      },
      create: {
        userId,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy ? parseFloat(accuracy) : null,
        altitude: altitude ? parseFloat(altitude) : null,
        heading: heading ? parseFloat(heading) : null,
        speed: speed ? parseFloat(speed) : null,
        recordedAt: now,
      },
    });

    // Update user's lastActiveAt
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: now },
    });

    // Check if location history is enabled in user settings
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (settings?.locationHistoryEnabled) {
      const lastHistory = await prisma.locationHistory.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
      });

      let shouldSaveHistory = true;
      if (lastHistory) {
        const dist = haversineDistance(
          Number(lastHistory.latitude),
          Number(lastHistory.longitude),
          lat,
          lng
        );
        const timeDiffSeconds = (now.getTime() - new Date(lastHistory.recordedAt).getTime()) / 1000;
        if (dist < 10 && timeDiffSeconds < 30) {
          shouldSaveHistory = false;
        }
      }

      if (shouldSaveHistory) {
        await prisma.locationHistory.create({
          data: {
            userId,
            latitude: lat,
            longitude: lng,
            accuracy: accuracy ? parseFloat(accuracy) : null,
            altitude: altitude ? parseFloat(altitude) : null,
            heading: heading ? parseFloat(heading) : null,
            speed: speed ? parseFloat(speed) : null,
            recordedAt: now,
          },
        });
      }
    }

    // Broadcast update via Socket.IO to authorized viewers
    const io = (req.app as any).get('io');
    if (io) {
      const permissions = await prisma.locationSharingPermission.findMany({
        where: {
          ownerId: userId,
          isActive: true,
        },
      });

      const validViewers = permissions.filter(
        (p) => !p.expiresAt || new Date(p.expiresAt) > now
      );

      for (const p of validViewers) {
        io.to(`user:${p.viewerId}`).emit('location:friend_updated', {
          userId,
          latitude: lat,
          longitude: lng,
          accuracy: location.accuracy,
          altitude: location.altitude,
          heading: location.heading,
          speed: location.speed,
          recordedAt: location.recordedAt,
        });
      }
    }

    return res.json({ success: true, location });
  } catch (error) {
    logger.error('Error updating location:', error);
    return res.status(500).json({ error: 'Failed to update location' });
  }
}

export async function getMyLocation(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const location = await prisma.location.findUnique({
      where: { userId },
    });

    return res.json({ location });
  } catch (error) {
    logger.error('Error getting my location:', error);
    return res.status(500).json({ error: 'Failed to get location' });
  }
}

export async function getFriendsLocations(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const friendsLocations = await getAuthorizedFriendsLocations(userId, prisma);
    return res.json({ friendsLocations });
  } catch (error) {
    logger.error('Error getting friends locations:', error);
    return res.status(500).json({ error: 'Failed to get friends locations' });
  }
}

export async function getFriendLocation(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const friendId = req.params.friendId as string;

    const hasPermission = await checkSharingPermission(friendId, userId, prisma);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied or location not shared' });
    }

    const location = await prisma.location.findUnique({
      where: { userId: friendId },
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const friend = await prisma.user.findUnique({
      where: { id: friendId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        lastActiveAt: true,
      },
    });

    return res.json({ friend, location });
  } catch (error) {
    logger.error('Error getting friend location:', error);
    return res.status(500).json({ error: 'Failed to get friend location' });
  }
}

export async function updateSharing(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { shareLocation, shareMode, friendId, durationMinutes } = req.body;

    if (friendId) {
      let expiresAt: Date | null = null;
      if (durationMinutes && durationMinutes > 0) {
        expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
      }

      const permission = await prisma.locationSharingPermission.upsert({
        where: { ownerId_viewerId: { ownerId: userId, viewerId: friendId } },
        update: {
          isActive: shareLocation ?? true,
          shareMode: expiresAt ? 'temporary' : (shareMode || 'always'),
          expiresAt,
        },
        create: {
          ownerId: userId,
          viewerId: friendId,
          isActive: shareLocation ?? true,
          shareMode: expiresAt ? 'temporary' : (shareMode || 'always'),
          expiresAt,
        },
      });

      return res.json({ success: true, permission });
    }

    const updatedSettings = await prisma.userSettings.update({
      where: { userId },
      data: {
        ...(shareLocation !== undefined && { shareLocation: Boolean(shareLocation) }),
        ...(shareMode !== undefined && { shareMode }),
      },
    });

    return res.json({ success: true, settings: updatedSettings });
  } catch (error) {
    logger.error('Error updating sharing permissions:', error);
    return res.status(500).json({ error: 'Failed to update sharing permissions' });
  }
}

export async function revokeSharing(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const friendId = req.params.friendId as string;

    await prisma.locationSharingPermission.updateMany({
      where: {
        ownerId: userId,
        viewerId: friendId,
      },
      data: {
        isActive: false,
      },
    });

    const io = (req.app as any).get('io');
    if (io) {
      io.to(`user:${friendId}`).emit('location:sharing_stopped', {
        userId,
      });
    }

    return res.json({ success: true, message: 'Sharing revoked successfully' });
  } catch (error) {
    logger.error('Error revoking sharing:', error);
    return res.status(500).json({ error: 'Failed to revoke sharing' });
  }
}

export async function getLocationHistory(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, limit = 100 } = req.query;

    const where: any = { userId };
    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.gte = new Date(String(startDate));
      if (endDate) where.recordedAt.lte = new Date(String(endDate));
    }

    const history = await prisma.locationHistory.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: Math.min(Number(limit), 500),
    });

    return res.json({ history });
  } catch (error) {
    logger.error('Error fetching location history:', error);
    return res.status(500).json({ error: 'Failed to get location history' });
  }
}

export async function deleteLocationHistory(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string | undefined;

    if (id) {
      await prisma.locationHistory.deleteMany({
        where: { id, userId },
      });
    } else {
      await prisma.locationHistory.deleteMany({
        where: { userId },
      });
    }

    return res.json({ success: true, message: 'History deleted' });
  } catch (error) {
    logger.error('Error deleting location history:', error);
    return res.status(500).json({ error: 'Failed to delete location history' });
  }
}
