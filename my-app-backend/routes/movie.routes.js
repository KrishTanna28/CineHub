import express from 'express';
import * as movieController from '../controllers/movie.controller.js';
import cache from '../utils/cache.js';

const router = express.Router();

// Cache TTL configurations (in seconds)
const CACHE_TTL = {
  TRENDING: 1800,      // 30 minutes
  POPULAR: 3600,       // 1 hour
  TOP_RATED: 7200,     // 2 hours
  NOW_PLAYING: 1800,   // 30 minutes
  UPCOMING: 3600,      // 1 hour
  DETAILS: 7200,       // 2 hours
  SEARCH: 1800,        // 30 minutes
  DISCOVER: 1800,      // 30 minutes
  GENRES: 86400,       // 24 hours
};

// Get trending movies (cached for 30 minutes)
router.get('/trending', cache.cacheMiddleware(CACHE_TTL.TRENDING), movieController.getTrending);

// Get popular movies (cached for 1 hour)
router.get('/popular', cache.cacheMiddleware(CACHE_TTL.POPULAR), movieController.getPopular);

// Get top rated movies (cached for 2 hours)
router.get('/top-rated', cache.cacheMiddleware(CACHE_TTL.TOP_RATED), movieController.getTopRated);

// Get now playing movies (cached for 30 minutes)
router.get('/now-playing', cache.cacheMiddleware(CACHE_TTL.NOW_PLAYING), movieController.getNowPlaying);

// Get upcoming movies (cached for 1 hour)
router.get('/upcoming', cache.cacheMiddleware(CACHE_TTL.UPCOMING), movieController.getUpcoming);

// Search movies (cached for 30 minutes)
router.get('/search', cache.cacheMiddleware(CACHE_TTL.SEARCH), movieController.searchMovies);

// Discover movies with filters (cached for 30 minutes)
router.get('/discover', cache.cacheMiddleware(CACHE_TTL.DISCOVER), movieController.discoverMovies);

// Get movie genres (cached for 24 hours)
router.get('/genres', cache.cacheMiddleware(CACHE_TTL.GENRES), movieController.getGenres);

// Get movie details by ID (cached for 2 hours)
router.get('/:id', cache.cacheMiddleware(CACHE_TTL.DETAILS), movieController.getMovieDetails);

// ===== TV SHOW ROUTES =====

// Get popular TV shows (cached for 1 hour)
router.get('/tv/popular', cache.cacheMiddleware(CACHE_TTL.POPULAR), movieController.getPopularTV);

// Get top rated TV shows (cached for 2 hours)
router.get('/tv/top-rated', cache.cacheMiddleware(CACHE_TTL.TOP_RATED), movieController.getTopRatedTV);

// Get airing today TV shows (cached for 30 minutes)
router.get('/tv/airing-today', cache.cacheMiddleware(CACHE_TTL.NOW_PLAYING), movieController.getAiringTodayTV);

// Get on the air TV shows (cached for 1 hour)
router.get('/tv/on-the-air', cache.cacheMiddleware(CACHE_TTL.UPCOMING), movieController.getOnTheAirTV);

// Search TV shows (cached for 30 minutes)
router.get('/tv/search', cache.cacheMiddleware(CACHE_TTL.SEARCH), movieController.searchTV);

// Discover TV shows with filters (cached for 30 minutes)
router.get('/tv/discover', cache.cacheMiddleware(CACHE_TTL.DISCOVER), movieController.discoverTV);

// Get TV show details by ID (cached for 2 hours)
router.get('/tv/:id', cache.cacheMiddleware(CACHE_TTL.DETAILS), movieController.getTVDetails);

// Get TV season details (cached for 2 hours)
router.get('/tv/:id/season/:seasonNumber', cache.cacheMiddleware(CACHE_TTL.DETAILS), movieController.getTVSeasonDetails);

// Search multi (movies + TV shows) (cached for 30 minutes)
router.get('/search/multi', cache.cacheMiddleware(CACHE_TTL.SEARCH), movieController.searchMulti);

export default router;
