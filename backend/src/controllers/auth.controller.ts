import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import fetch from 'node-fetch';
import { OAuth2Client } from 'google-auth-library';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../config/jwt';
import prisma from '../config/database';
import { RequestWithUser } from '../types';
import { sanitizeUser, hashToken } from '../utils/helpers';
import logger from '../utils/logger';
import path from 'path';

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  '715090036708-djgkdmqpurkmoafrkav99tom32eu5m71.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '7', 10);

/**
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password, displayName } = req.body;

    // Check existing user
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      const field = existing.email === email ? 'email' : 'username';
      res.status(409).json({ success: false, message: `This ${field} is already taken` });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user with default settings
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        displayName,
        settings: {
          create: {
            language: 'km',
            theme: 'light',
            shareLocation: false,
          },
        },
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const tokenHash = hashToken(refreshToken);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash,
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent']?.substring(0, 500),
        expiresAt,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: sanitizeUser({ ...user }),
        accessToken,
        refreshToken,
        token: accessToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { login: loginInput, password } = req.body;

    // Find user by email or username
    const isEmail = loginInput.includes('@');
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: loginInput } : { username: loginInput },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, message: 'Account has been suspended' });
      return;
    }

    if (user.status === 'deleted') {
      res.status(404).json({ success: false, message: 'Account not found' });
      return;
    }

    // Verify password
    if (!user.passwordHash) {
      res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please sign in with Google.',
      });
      return;
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const tokenHash = hashToken(refreshToken);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash,
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent']?.substring(0, 500),
        expiresAt,
      },
    });

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: sanitizeUser({ ...user }),
        accessToken,
        refreshToken,
        token: accessToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
}

/**
 * POST /api/auth/refresh
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token required' });
      return;
    }

    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
      return;
    }

    const tokenHash = hashToken(token);
    const session = await prisma.userSession.findUnique({ where: { tokenHash } });

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ success: false, message: 'Session expired or invalid' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.status !== 'active') {
      res.status(401).json({ success: false, message: 'User not found or inactive' });
      return;
    }

    // Rotate tokens
    const newAccessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);
    const newTokenHash = hashToken(newRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

    await prisma.userSession.update({
      where: { id: session.id },
      data: { tokenHash: newTokenHash, expiresAt },
    });

    res.json({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      const tokenHash = hashToken(token);
      await prisma.userSession.deleteMany({ where: { tokenHash } });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
}

/**
 * GET /api/auth/me
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as RequestWithUser).user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: sanitizeUser({ ...user }),
    });
  } catch (error) {
    logger.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
}

/**
 * PATCH /api/auth/profile
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as RequestWithUser).user.id;
    const { displayName, bio } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: sanitizeUser({ ...updated }),
    });
  } catch (error) {
    logger.error('UpdateProfile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
}

/**
 * POST /api/auth/change-password
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as RequestWithUser).user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.passwordHash) {
      const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!passwordValid) {
        res.status(401).json({ success: false, message: 'Current password is incorrect' });
        return;
      }
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Invalidate all sessions
    await prisma.userSession.deleteMany({ where: { userId } });

    res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
  } catch (error) {
    logger.error('ChangePassword error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
}

/**
 * POST /api/auth/avatar
 */
export async function uploadAvatar(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const userId = (req as RequestWithUser).user.id;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl: updated.avatarUrl,
        user: sanitizeUser({ ...updated }),
      },
    });
  } catch (error) {
    logger.error('UploadAvatar error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload avatar' });
  }
}

/**
 * POST /api/auth/google
 */
export async function googleLogin(req: Request, res: Response): Promise<void> {
  try {
    const { credential, idToken, accessToken } = req.body;
    const tokenToVerify = credential || idToken;

    let payload: {
      sub: string;
      email: string;
      name?: string;
      picture?: string;
      email_verified?: boolean | string;
    } | null = null;

    if (tokenToVerify) {
      if (GOOGLE_CLIENT_ID) {
        try {
          const ticket = await googleClient.verifyIdToken({
            idToken: tokenToVerify,
            audience: GOOGLE_CLIENT_ID,
          });
          const ticketPayload = ticket.getPayload();
          if (ticketPayload && ticketPayload.email) {
            payload = {
              sub: ticketPayload.sub,
              email: ticketPayload.email,
              name: ticketPayload.name,
              picture: ticketPayload.picture,
              email_verified: ticketPayload.email_verified,
            };
          }
        } catch (err) {
          logger.warn('Google client verification failed, falling back to tokeninfo API:', err);
        }
      }

      // Fallback verification via Google's tokeninfo API
      if (!payload) {
        try {
          const tokenInfoRes = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenToVerify}`
          );
          if (tokenInfoRes.ok) {
            const data = (await tokenInfoRes.json()) as any;
            if (data.email) {
              payload = {
                sub: data.sub,
                email: data.email,
                name: data.name,
                picture: data.picture,
                email_verified: data.email_verified,
              };
            }
          }
        } catch (fetchErr) {
          logger.error('Failed to verify token with Google tokeninfo:', fetchErr);
        }
      }
    } else if (accessToken) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          const data = (await userInfoRes.json()) as any;
          if (data.email) {
            payload = {
              sub: data.sub,
              email: data.email,
              name: data.name,
              picture: data.picture,
              email_verified: data.email_verified,
            };
          }
        }
      } catch (userErr) {
        logger.error('Failed to fetch userinfo with access token:', userErr);
      }
    }

    if (!payload || !payload.email) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired Google credential',
      });
      return;
    }

    const { sub: googleId, email, name, picture } = payload;
    const displayName = name || email.split('@')[0];

    // Find user by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
      include: { settings: true },
    });

    if (user) {
      if (user.status === 'suspended') {
        res.status(403).json({ success: false, message: 'Account has been suspended' });
        return;
      }
      if (user.status === 'deleted') {
        res.status(404).json({ success: false, message: 'Account not found' });
        return;
      }

      // Link googleId if not linked yet
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            avatarUrl: user.avatarUrl || picture,
            emailVerified: true,
          },
          include: { settings: true },
        });
      }
    } else {
      // Create new user from Google profile
      const baseUsername =
        email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user';
      let username = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername.slice(0, 15)}_${counter++}`;
      }

      user = await prisma.user.create({
        data: {
          username,
          email,
          displayName,
          avatarUrl: picture,
          googleId,
          emailVerified: true,
          settings: {
            create: {
              language: 'km',
              theme: 'light',
              shareLocation: false,
            },
          },
        },
        include: { settings: true },
      });
    }

    // Generate tokens
    const newAccessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const tokenHash = hashToken(refreshToken);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash,
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent']?.substring(0, 500),
        expiresAt,
      },
    });

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    res.json({
      success: true,
      message: 'Logged in with Google successfully',
      data: {
        user: sanitizeUser({ ...user }),
        accessToken: newAccessToken,
        refreshToken,
        token: newAccessToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    logger.error('Google login error:', error);
    res.status(500).json({ success: false, message: 'Google login failed' });
  }
}
