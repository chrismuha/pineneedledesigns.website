import { Router } from 'express';
import {
  getPushConfig,
  sendTestPush,
  subscribeToPush,
  unsubscribeFromPush,
} from '../controllers/pushController.js';

const router = Router();

router.get('/config', getPushConfig);
router.post('/subscribe', subscribeToPush);
router.post('/unsubscribe', unsubscribeFromPush);
router.post('/test', sendTestPush);

export default router;
