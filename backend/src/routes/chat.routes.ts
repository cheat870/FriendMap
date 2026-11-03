import { Router } from 'express';
import {
  getConversations,
  getOrCreateDirectConversation,
  getMessages,
  sendMessage,
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/conversations', getConversations);
router.post('/direct', getOrCreateDirectConversation);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', sendMessage);

export default router;
