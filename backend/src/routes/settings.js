import { Router } from 'express';
import { getStoreSettings, updateStoreSettings } from '../controllers/settingsController.js';

const router = Router();
router.get('/', getStoreSettings);
router.put('/', updateStoreSettings);
export default router;

