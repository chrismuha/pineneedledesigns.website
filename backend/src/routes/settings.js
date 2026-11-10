import { Router } from 'express';
import { getStoreSettings, updateStoreSettings, updateNewArrivalsSettings } from '../controllers/settingsController.js';
import { requireCloudflareAccess } from '../middleware/cloudflareAccess.js';

const router = Router();
router.get('/', getStoreSettings);
router.put('/new-arrivals', requireCloudflareAccess, updateNewArrivalsSettings);
router.put('/', requireCloudflareAccess, updateStoreSettings);
export default router;
