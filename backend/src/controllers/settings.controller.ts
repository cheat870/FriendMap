import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';

export async function getSettings(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId },
      });
    }

    return res.json({ settings });
  } catch (error) {
    logger.error('Error fetching settings:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const {
      language,
      theme,
      shareLocation,
      shareMode,
      locationHistoryEnabled,
      historyRetentionDays,
      notifyFriendRequest,
      notifyMessages,
      notifyLocationShare,
      notifyArrival,
    } = req.body;

    const data: any = {};
    if (language !== undefined) data.language = language;
    if (theme !== undefined) data.theme = theme;
    if (shareLocation !== undefined) data.shareLocation = Boolean(shareLocation);
    if (shareMode !== undefined) data.shareMode = shareMode;
    if (locationHistoryEnabled !== undefined) data.locationHistoryEnabled = Boolean(locationHistoryEnabled);
    if (historyRetentionDays !== undefined) data.historyRetentionDays = Number(historyRetentionDays);
    if (notifyFriendRequest !== undefined) data.notifyFriendRequest = Boolean(notifyFriendRequest);
    if (notifyMessages !== undefined) data.notifyMessages = Boolean(notifyMessages);
    if (notifyLocationShare !== undefined) data.notifyLocationShare = Boolean(notifyLocationShare);
    if (notifyArrival !== undefined) data.notifyArrival = Boolean(notifyArrival);

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    return res.json({ success: true, settings });
  } catch (error) {
    logger.error('Error updating settings:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
}
