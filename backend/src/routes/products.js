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

const uploadErrorResponse = (error) => {
  if (/unexpected end of form/i.test(String(error?.message || ''))) {
    return {
      status: 408,
      message: 'The media upload ended before it reached the server. Keep the app open, check the connection, and try saving again.',
    };
  }

  return {
    status: 400,
    message: error?.message || 'Media upload failed.',
  };
};

const handlePhotoUpload = (req, res, next) => {
  upload.fields([{ name: 'photos', maxCount: 20 }, { name: 'videos', maxCount: 10 }])(req, res, (err) => {
    if (err) {
      const response = uploadErrorResponse(err);
      return res.status(response.status).json({ error: response.message });
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
