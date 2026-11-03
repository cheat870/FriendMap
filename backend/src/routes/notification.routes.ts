import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllRead);
router.delete('/:id', deleteNotification);

export default router;
