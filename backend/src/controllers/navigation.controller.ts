import { Request, Response } from 'express';
import prisma from '../config/database';
import { getOSRMRoute } from '../services/routing.service';
import { checkSharingPermission, haversineDistance } from '../services/location.service';
import logger from '../utils/logger';

const ARRIVAL_RADIUS_M = parseInt(process.env.ARRIVAL_RADIUS_M || '50', 10);

export async function getRoute(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { targetUserId, originLat, originLng, destLat, destLng, mode = 'driving' } = req.body;

    let startLat = originLat ? parseFloat(originLat) : null;
    let startLng = originLng ? parseFloat(originLng) : null;
    let endLat = destLat ? parseFloat(destLat) : null;
    let endLng = destLng ? parseFloat(destLng) : null;

    if (startLat === null || startLng === null) {
      const myLoc = await prisma.location.findUnique({ where: { userId } });
      if (!myLoc) {
        return res.status(400).json({ error: 'User origin location not found. Please enable GPS.' });
      }
      startLat = Number(myLoc.latitude);
      startLng = Number(myLoc.longitude);
    }

    if (targetUserId) {
      const hasPermission = await checkSharingPermission(targetUserId, userId, prisma);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied to access friend location' });
      }
      const targetLoc = await prisma.location.findUnique({ where: { userId: targetUserId } });
      if (!targetLoc) {
        return res.status(404).json({ error: 'Friend location not available' });
      }
      endLat = Number(targetLoc.latitude);
      endLng = Number(targetLoc.longitude);
    }

    if (endLat === null || endLng === null) {
      return res.status(400).json({ error: 'Destination coordinates required' });
    }

    const route = await getOSRMRoute(startLat, startLng, endLat, endLng, mode);
    return res.json({ route, origin: { lat: startLat, lng: startLng }, destination: { lat: endLat, lng: endLng } });
  } catch (error) {
    logger.error('Error calculating route:', error);
    return res.status(500).json({ error: 'Failed to calculate route. Ensure routing service is accessible.' });
  }
}

export async function startNavigation(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { targetUserId, originLat, originLng, destLat, destLng, transportMode = 'driving' } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    const hasPermission = await checkSharingPermission(targetUserId, userId, prisma);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Cannot navigate to a friend without active location sharing permission' });
    }

    await prisma.navigationSession.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'cancelled', endedAt: new Date() },
    });

    const route = await getOSRMRoute(originLat, originLng, destLat, destLng, transportMode);

    const session = await prisma.navigationSession.create({
      data: {
        userId,
        targetUserId,
        transportMode,
        status: 'active',
        originLat,
        originLng,
        destLat,
        destLng,
        distanceM: route.distance,
        durationS: route.duration,
      },
    });

    await prisma.navigationEvent.create({
      data: {
        sessionId: session.id,
        eventType: 'started',
        userLat: originLat,
        userLng: originLng,
        destLat,
        destLng,
        remainingM: route.distance,
        remainingS: route.duration,
      },
    });

    const io = (req.app as any).get('io');
    if (io) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, displayName: true, username: true, avatarUrl: true },
      });

      io.to(`user:${targetUserId}`).emit('navigation:started', {
        sessionId: session.id,
        navigator: user,
        transportMode,
        etaSeconds: route.duration,
      });
    }

    return res.json({ session, route });
  } catch (error) {
    logger.error('Error starting navigation session:', error);
    return res.status(500).json({ error: 'Failed to start navigation' });
  }
}

export async function updateNavigation(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const sessionId = req.params.sessionId as string;
    const { userLat, userLng, destLat, destLng, remainingM, remainingS, transportMode = 'driving' } = req.body;

    const session = await prisma.navigationSession.findFirst({
      where: { id: sessionId, userId, status: 'active' },
    });

    if (!session) {
      return res.status(404).json({ error: 'Active navigation session not found' });
    }

    const currentDestLat = destLat !== undefined ? destLat : Number(session.destLat);
    const currentDestLng = destLng !== undefined ? destLng : Number(session.destLng);

    const distanceToDest = haversineDistance(userLat, userLng, currentDestLat, currentDestLng);
    const hasArrived = distanceToDest <= ARRIVAL_RADIUS_M;

    let recalculatedRoute = null;

    const targetMovement = haversineDistance(
      Number(session.destLat),
      Number(session.destLng),
      currentDestLat,
      currentDestLng
    );

    if (targetMovement > 50) {
      recalculatedRoute = await getOSRMRoute(userLat, userLng, currentDestLat, currentDestLng, transportMode);
    }

    await prisma.navigationEvent.create({
      data: {
        sessionId,
        eventType: hasArrived ? 'arrived' : (recalculatedRoute ? 'route_recalculated' : 'location_updated'),
        userLat,
        userLng,
        destLat: currentDestLat,
        destLng: currentDestLng,
        remainingM: remainingM || Math.round(distanceToDest),
        remainingS,
      },
    });

    const io = (req.app as any).get('io');

    if (hasArrived) {
      await prisma.navigationSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          arrivedAt: new Date(),
          endedAt: new Date(),
        },
      });

      if (io) {
        io.to(`user:${session.targetUserId}`).emit('navigation:arrived', {
          sessionId,
          userId,
        });
        io.to(`user:${userId}`).emit('navigation:arrived', {
          sessionId,
          targetUserId: session.targetUserId,
        });
      }

      return res.json({ arrived: true, message: 'You have arrived at your friend location!' });
    }

    if (recalculatedRoute && io) {
      io.to(`user:${userId}`).emit('navigation:route_updated', {
        sessionId,
        route: recalculatedRoute,
      });
    }

    return res.json({
      arrived: false,
      distanceToDest: Math.round(distanceToDest),
      recalculatedRoute,
    });
  } catch (error) {
    logger.error('Error updating navigation:', error);
    return res.status(500).json({ error: 'Failed to update navigation' });
  }
}

export async function endNavigation(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const sessionId = req.params.sessionId as string;

    const session = await prisma.navigationSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await prisma.navigationSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        endedAt: new Date(),
      },
    });

    const io = (req.app as any).get('io');
    if (io) {
      io.to(`user:${session.targetUserId}`).emit('navigation:ended', {
        sessionId,
        userId,
      });
    }

    return res.json({ success: true, message: 'Navigation ended' });
  } catch (error) {
    logger.error('Error ending navigation:', error);
    return res.status(500).json({ error: 'Failed to end navigation' });
  }
}

export async function getSession(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const sessionId = req.params.sessionId as string;

    const session = await prisma.navigationSession.findFirst({
      where: {
        id: sessionId,
        OR: [{ userId }, { targetUserId: userId }],
      },
      include: {
        user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
        targetUser: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json({ session });
  } catch (error) {
    logger.error('Error fetching navigation session:', error);
    return res.status(500).json({ error: 'Failed to get session' });
  }
}
