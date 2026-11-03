import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  uploadAvatar,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { uploadAvatarMiddleware } from '../middleware/upload';
import { validateBody } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, validateBody(updateProfileSchema), updateProfile);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), changePassword);
router.post('/avatar', authenticate, uploadAvatarMiddleware, uploadAvatar);

export default router;
