import express from 'express';
import {
  register,
  completeRegistration,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getUserById,
  addToWatchlist,
  removeFromWatchlist,
  getUserWatchlist,
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  rateMovie,
  getUserRatings,
  getUserStats,
  followUser,
  unfollowUser,
  getLeaderboard,
  sendVerificationOTPController,
  verifyMobileController
} from '../controllers/User.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  movieIdValidation,
  ratingValidation,
  validate
} from '../middleware/validation.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.post('/register', uploadSingle, handleUploadError, registerValidation, validate, register);
router.post('/complete-registration', completeRegistration);
router.post('/login', loginValidation, validate, login);
router.get('/leaderboard', getLeaderboard);

// Protected routes - require authentication
router.use(authenticate); // All routes below require authentication

// Profile management (must come before /:id route)
router.get('/me', getProfile);
router.put('/me', uploadSingle, handleUploadError, updateProfileValidation, validate, updateProfile);
router.put('/me/password', changePasswordValidation, validate, changePassword);
router.get('/me/stats', getUserStats);

// Mobile verification
router.post('/me/send-verification-otp', sendVerificationOTPController);
router.post('/me/verify-mobile', verifyMobileController);

// Watchlist management
router.get('/me/watchlist', getUserWatchlist);
router.post('/me/watchlist', movieIdValidation, validate, addToWatchlist);
router.delete('/me/watchlist/:movieId', removeFromWatchlist);

// Favorites management
router.get('/me/favorites', getUserFavorites);
router.post('/me/favorites', movieIdValidation, validate, addToFavorites);
router.delete('/me/favorites/:movieId', removeFromFavorites);

// Ratings
router.get('/me/ratings', getUserRatings);
router.post('/me/ratings', ratingValidation, validate, rateMovie);

// Social features
router.post('/:id/follow', followUser);
router.delete('/:id/follow', unfollowUser);

// Get user by ID (must come AFTER all /me routes)
router.get('/:id', optionalAuth, getUserById);

export default router;
