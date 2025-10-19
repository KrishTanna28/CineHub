import express from 'express';
import { uploadAvatar, deleteAvatar, uploadMultipleImages } from '../controllers/Upload.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadSingle, uploadMultiple, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// All upload routes require authentication
router.use(authenticate);

// Avatar upload/delete
router.post('/avatar', uploadSingle, handleUploadError, uploadAvatar);
router.delete('/avatar', deleteAvatar);

// Multiple images upload (admin/moderator only)
router.post('/images', authorize('admin', 'moderator'), uploadMultiple, handleUploadError, uploadMultipleImages);

export default router;
