import { Router } from 'express';
import { changeOrder, listOrders, getOrderById, deleteOrder, permanentlyDeleteOrder, resolveOrder, updateOrderStatus } from '../controllers/orderController.js';

const router = Router();

router.get('/', listOrders);
router.get('/:id', getOrderById);
router.delete('/:id', deleteOrder);
router.delete('/:id/permanent', permanentlyDeleteOrder);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/change', changeOrder);
router.post('/:id/resolve', resolveOrder);

export default router;
