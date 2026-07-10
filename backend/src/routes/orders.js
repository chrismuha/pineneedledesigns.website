import { Router } from 'express';
import { listOrders, getOrderById, resolveOrder, updateOrderStatus } from '../controllers/orderController.js';

const router = Router();

router.get('/', listOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/resolve', resolveOrder);

export default router;
