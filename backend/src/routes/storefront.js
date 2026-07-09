import { Router } from 'express';
import {
  getCatalog,
  getCollectionBySlug,
  getProductsBySlug,
  getSubcollectionsBySlug,
} from '../controllers/storefrontController.js';

const router = Router();

router.get('/catalog', getCatalog);
router.get('/collections/:slug/subcollections', getSubcollectionsBySlug);
router.get('/collections/:slug/products', getProductsBySlug);
router.get('/collections/:slug', getCollectionBySlug);

export default router;
