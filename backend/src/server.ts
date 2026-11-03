import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

import { connectDatabase } from './config/database';
import initializeSockets from './sockets';
import logger from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import friendRoutes from './routes/friend.routes';
import locationRoutes from './routes/location.routes';
import navigationRoutes from './routes/navigation.routes';
import chatRoutes from './routes/chat.routes';
import notificationRoutes from './routes/notification.routes';
import settingsRoutes from './routes/settings.routes';
import adminRoutes from './routes/admin.routes';
import userRoutes from './routes/user.routes';

const app = express();
const server = http.createServer(app);

const PORT = parseInt(process.env.PORT || '5000', 10);
const rawCorsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
const corsOrigin =
  rawCorsOrigin === '*'
    ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) =>
        callback(null, true)
    : rawCorsOrigin.includes(',')
    ? rawCorsOrigin.split(',').map((s) => s.trim())
    : rawCorsOrigin;

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: rawCorsOrigin === '*' ? true : corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Store io on app for controllers to access
app.set('io', io);

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: corsOrigin as any,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging
app.use(morgan('dev'));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'FriendMap API Server',
    timestamp: new Date().toISOString(),
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Initialize Socket.IO Handlers
initializeSockets(io);

// Start Server
async function startServer() {
  try {
    await connectDatabase();
    server.listen(PORT, () => {
      logger.info(`FriendMap backend running on port ${PORT}`);
      logger.info(`CORS enabled for origin: ${rawCorsOrigin}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, server, io };
