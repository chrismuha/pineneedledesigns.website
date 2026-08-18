import { Router } from 'express';
import {
  confirmBookingDeposit,
  createBookingDeposit,
  captureBookingDeposit,
  getBookingDepositConfig,
} from '../controllers/bookingController.js';

const router = Router();

router.get('/config', getBookingDepositConfig);
router.post('/', createBookingDeposit);
router.get('/confirm/:sessionId', confirmBookingDeposit);
router.get('/capture/:token', captureBookingDeposit);

export default router;
