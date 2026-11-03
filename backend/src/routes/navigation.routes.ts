import { Router } from 'express';
import {
  getRoute,
  startNavigation,
  updateNavigation,
  endNavigation,
  getSession,
} from '../controllers/navigation.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/route', getRoute);
router.post('/start', startNavigation);
router.post('/update/:sessionId', updateNavigation);
router.post('/end/:sessionId', endNavigation);
router.get('/session/:sessionId', getSession);

export default router;
