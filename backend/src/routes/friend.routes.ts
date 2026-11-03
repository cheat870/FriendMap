import { Router } from 'express';
import {
  getFriends,
  searchUsers,
  sendRequest,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  removeFriend,
  blockUser,
  unblockUser,
  getPendingRequests,
} from '../controllers/friend.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { sendFriendRequestSchema } from '../validators/friend.validator';

const router = Router();

router.use(authenticate);

router.get('/', getFriends);
router.get('/search', searchUsers);
router.get('/requests', getPendingRequests);
router.post('/request', validateBody(sendFriendRequestSchema), sendRequest);
router.patch('/request/:requestId/accept', acceptRequest);
router.patch('/request/:requestId/reject', rejectRequest);
router.delete('/request/:requestId', cancelRequest);
router.delete('/:friendId', removeFriend);
router.post('/:userId/block', blockUser);
router.delete('/:userId/block', unblockUser);

export default router;
