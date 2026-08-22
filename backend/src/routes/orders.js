import { Router } from 'express';
import { listOrders, getOrderById, deleteOrder, resolveOrder, updateOrderStatus } from '../controllers/orderController.js';

const router = Router();

router.get('/', listOrders);
router.get('/:id', getOrderById);
router.delete('/:id', deleteOrder);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/resolve', resolveOrder);

export default router;
