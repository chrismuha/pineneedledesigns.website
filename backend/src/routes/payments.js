import { Router } from 'express';
import {
  confirmCloverPaymentHandler,
  createCloverPaymentHandler,
  getPaymentStatusHandler,
} from '../controllers/paymentController.js';

const router = Router();

router.post('/clover', createCloverPaymentHandler);
router.get('/clover/confirm/:sessionId', confirmCloverPaymentHandler);
router.get('/clover/:paymentId', getPaymentStatusHandler);

export default router;
