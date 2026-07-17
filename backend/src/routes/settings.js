import { Router } from 'express';
import { getStoreSettings, updateStoreSettings } from '../controllers/settingsController.js';
import { requireCloudflareAccess } from '../middleware/cloudflareAccess.js';

const router = Router();
router.get('/', getStoreSettings);
router.put('/', requireCloudflareAccess, updateStoreSettings);
export default router;
