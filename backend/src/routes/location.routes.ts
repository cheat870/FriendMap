import { Router } from 'express';
import {
  updateLocation,
  getMyLocation,
  getFriendsLocations,
  getFriendLocation,
  updateSharing,
  revokeSharing,
  getLocationHistory,
  deleteLocationHistory,
} from '../controllers/location.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { locationUpdateSchema } from '../validators/location.validator';

const router = Router();

router.use(authenticate);

router.post('/update', validateBody(locationUpdateSchema), updateLocation);
router.get('/me', getMyLocation);
router.get('/friends', getFriendsLocations);
router.get('/friend/:friendId', getFriendLocation);
router.post('/sharing', updateSharing);
router.delete('/sharing/:friendId', revokeSharing);
router.get('/history', getLocationHistory);
router.delete('/history', deleteLocationHistory);
router.delete('/history/:id', deleteLocationHistory);

export default router;
