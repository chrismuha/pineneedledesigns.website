import { Router } from 'express';
import collectionsRouter from './collections.js';
import productsRouter from './products.js';
import cartRouter from './cart.js';
import checkoutRouter from './checkout.js';
import bookingRouter from './booking.js';
import healthRouter from './health.js';
import dashboardRouter from './dashboard.js';
import ordersRouter from './orders.js';
import pushRouter from './push.js';
import storefrontRouter from './storefront.js';
import settingsRouter from './settings.js';
import { requireCloudflareAccess } from '../middleware/cloudflareAccess.js';

const router = Router();

router.use('/storefront', storefrontRouter);
router.use('/settings', settingsRouter);
router.use('/collections', requireCloudflareAccess, collectionsRouter);
router.use('/products', requireCloudflareAccess, productsRouter);
router.use('/cart', cartRouter);
router.use('/checkout', checkoutRouter);
router.use('/booking-deposit', bookingRouter);
router.use('/health', healthRouter);
router.use('/dashboard', requireCloudflareAccess, dashboardRouter);
router.use('/orders', requireCloudflareAccess, ordersRouter);
router.use('/push', requireCloudflareAccess, pushRouter);

export default router;
