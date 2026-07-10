import { Router } from 'express';
import upload, { convertUploadedMedia } from '../middleware/upload.js';

import {
  listProducts,
  listProductsGrouped,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';

const router = Router();

const handlePhotoUpload = (req, res, next) => {
  upload.fields([{ name: 'photos', maxCount: 20 }, { name: 'videos', maxCount: 10 }])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Photo upload failed.' });
    }
    return convertUploadedMedia(req, res, next);
  });
};

router.get('/grouped', listProductsGrouped);
router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', handlePhotoUpload, createProduct);
router.put('/:id', handlePhotoUpload, updateProduct);
router.delete('/:id', deleteProduct);

export default router;
