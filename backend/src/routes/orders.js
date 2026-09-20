import { Router } from 'express';
import { changeOrder, listOrders, getOrderById, deleteOrder, permanentlyDeleteOrder, refundOrderInCloverOnly, resolveOrder, updateOrderNumber, updateOrderStatus, verifyOrderPayment } from '../controllers/orderController.js';

const router = Router();

router.get('/', listOrders);
router.get('/:id', getOrderById);
router.delete('/:id', deleteOrder);
router.delete('/:id/permanent', permanentlyDeleteOrder);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/payment-verification', verifyOrderPayment);
router.patch('/:id/order-number', updateOrderNumber);
router.post('/:id/change', changeOrder);
router.post('/:id/refund-clover-only', refundOrderInCloverOnly);
router.post('/:id/resolve', resolveOrder);

export default router;
