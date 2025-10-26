import express from 'express';
import {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  likeReview,
  dislikeReview,
  addReply,
  likeReply,
  dislikeReply,
  getUserReviews
} from '../controllers/Review.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { preventReviewSpam, preventReplySpam } from '../middleware/spamPrevention.js';

const router = express.Router();

// Public routes
router.get('/:mediaType/:mediaId', getReviews);
router.get('/review/:id', getReviewById);

// authenticateed routes (require authentication + spam prevention)
router.post('/', authenticate, preventReviewSpam, createReview);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);
router.post('/:id/like', authenticate, likeReview);
router.post('/:id/dislike', authenticate, dislikeReview);
router.post('/:id/reply', authenticate, preventReplySpam, addReply);
router.post('/:id/reply/:replyId/like', authenticate, likeReply);
router.post('/:id/reply/:replyId/dislike', authenticate, dislikeReply);
router.get('/user/my-reviews', authenticate, getUserReviews);

export default router;
