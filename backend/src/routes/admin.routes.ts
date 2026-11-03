import { Router } from 'express';
import {
  getStats,
  getUsers,
  updateUserStatus,
  updateUserRole,
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'moderator'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/role', updateUserRole);

export default router;
