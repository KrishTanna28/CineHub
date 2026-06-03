/**
 * Cinnect AI Assistant - Context Builder Module
 * Assembles relevant context based on intent and user data
 */

import connectDB from '@/lib/config/database';
import User from '@/lib/models/User';
import Review from '@/lib/models/Review';
import Post from '@/lib/models/Post';
import UserActivity from '@/lib/models/UserActivity';
import { INTENTS } from './intentClassifier';
import * as tmdbService from '@/lib/services/tmdb.service';
import { buildCacheKey, remember } from '@/lib/utils/cache.js';

const CONTEXT_CACHE_TTL = 5 * 60;

/**
 * Build context based on classification and available user data
 */
export async function buildContext(classification, userId = null, message = '') {
  const [platform, user, content, community, trending] = await Promise.all([
    classification.intent === INTENTS.GUIDANCE
      ? getDetailedPlatformContext()
      : getPlatformContext(),
    userId && classification.requiresUserContext
      ? fetchUserContext(userId)
      : null,
    fetchContentContext(classification, userId),
    fetchIntentCommunityContext(classification, message),
    classification.intent === INTENTS.TRENDING
      ? fetchTrendingContext()
      : null
  ]);

  return { platform, user, content, community, trending };
}

async function fetchContentContext(classification, userId) {
  switch (classification.intent) {
    case INTENTS.DISCOVERY:
    case INTENTS.PERSONALIZATION:
      return fetchDiscoveryContext(classification, userId);
    case INTENTS.INFORMATION:
    case INTENTS.SUMMARY:
      if (classification.entities.mediaTitle) {
        return fetchMediaContext(classification.entities);
      }
      return null;
    default:
      return null;
  }
}

async function fetchIntentCommunityContext(classification, message) {
  if (classification.intent === INTENTS.COMMUNITY) {
    return fetchCommunityContext(message);
  }
  if (classification.intent === INTENTS.EXPLANATION) {
    return fetchExplanationContext(message);
  }
  return null;
}

/**
 * Fetch user-specific context
 */
async function fetchUserContext(userId) {
  try {
    await connectDB();

    const [user, activity, recentReviews] = await Promise.all([
      User.findById(userId)
        .select('username favoriteGenres watchlist favorites watchHistory points level streaks achievements')
        .lean(),
      UserActivity.findOne({ user: userId })
        .select('recentViews genreFrequency')
        .lean(),
      Review.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('mediaTitle mediaType rating')
        .lean()
    ]);

    if (!user) return null;

    const recentWatched = await resolveRecentWatchedTitles(user.watchHistory || []);

    return {
      username: user.username,
      level: user.level,
      points: user.points?.total || 0,
      streak: user.streaks?.current || 0,
      favoriteGenres: user.favoriteGenres || [],
      watchlistCount: user.watchlist?.length || 0,
      favoritesCount: user.favorites?.length || 0,
      watchedCount: user.watchHistory?.length || 0,
      recentWatched,
      recentRatings: recentReviews.map(r => ({
        title: r.mediaTitle,
        type: r.mediaType,
        rating: r.rating
      })),
      genrePreferences: activity?.genreFrequency
        ? Object.entries(activity.genreFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([genre]) => genre)
        : [],
      recentViews: activity?.recentViews?.slice(0, 5).map(v => ({
        title: v.title,
        type: v.mediaType
      })) || []
    };
  } catch (error) {
    console.error('Error fetching user context:', error);
    return null;
  }
}

/**
 * Resolve recent watched items to human-readable titles
 */
async function resolveRecentWatchedTitles(watchHistory, limit = 5) {
  if (!Array.isArray(watchHistory) || watchHistory.length === 0) {
    return [];
  }

  const recentItems = [...watchHistory]
    .filter(item => item?.movieId || item?.mediaId)
    .sort((a, b) => {
      const aTime = a?.watchedAt ? new Date(a.watchedAt).getTime() : 0;
      const bTime = b?.watchedAt ? new Date(b.watchedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, limit);

  const resolved = await Promise.all(
    recentItems.map(async (item) => {
      const mediaId = String(item.movieId || item.mediaId);
      const mediaType = item.mediaType === 'tv' ? 'tv' : 'movie';
      const cacheKey = buildCacheKey('ai-context', 'watched-title', mediaType, mediaId);

      const titleData = await remember(cacheKey, 24 * 60 * 60, async () => {
        try {
          if (mediaType === 'tv') {
            const tv = await tmdbService.getTVDetails(mediaId).catch(() => null);
            return tv
              ? { title: tv.title, year: tv.firstAirDate?.split('-')[0] }
              : null;
          }

          const movie = await tmdbService.getMovieDetails(mediaId).catch(() => null);
          return movie
            ? { title: movie.title, year: movie.releaseDate?.split('-')[0] }
            : null;
        } catch {
          return null;
        }
      });

      return {
        title: titleData?.title || `${mediaType.toUpperCase()} #${mediaId}`,
        year: titleData?.year || null,
        mediaType
      };
    })
  );

  return resolved;
}

/**
 * Fetch discovery/recommendation context
 */
async function fetchDiscoveryContext(classification, userId) {
  const context = {};

  try {
    const [trendingMovies, trendingTV] = await Promise.all([
      remember(
        buildCacheKey('ai-context', 'discovery', 'trending', 'movie', 'week'),
        CONTEXT_CACHE_TTL,
        () => tmdbService.getTrending('movie', 'week').catch(() => [])
      ),
      remember(
        buildCacheKey('ai-context', 'discovery', 'trending', 'tv', 'week'),
        CONTEXT_CACHE_TTL,
        () => tmdbService.getTrending('tv', 'week').catch(() => [])
      )
    ]);

    context.trendingMovies = formatMediaList(trendingMovies, 5);
    context.trendingTV = formatMediaList(trendingTV, 5);

    // If user has preferences, get genre-specific content
    if (userId) {
      await connectDB();
      const user = await User.findById(userId).select('favoriteGenres').lean();

      if (user?.favoriteGenres?.length > 0) {
        const genreIds = getGenreIds(user.favoriteGenres);
        if (genreIds) {
          const recommended = await remember(
            buildCacheKey('ai-context', 'discovery', 'genres', genreIds),
            CONTEXT_CACHE_TTL,
            () => tmdbService.discoverMovies({
              genres: genreIds,
              sortBy: 'vote_average.desc',
              minRating: '7'
            }).catch(() => ({ results: [] }))
          );

          context.genreRecommendations = formatMediaList(recommended.results, 5);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching discovery context:', error);
  }

  return context;
}

/**
 * Fetch specific media context
 */
async function fetchMediaContext(entities) {
  try {
    const { mediaTitle, mediaType } = entities;

    // Search for the media
    const results = await tmdbService.searchMulti(mediaTitle).catch(() => ({ results: [] }));

    if (results.results?.length > 0) {
      const firstResult = results.results[0];
      const type = firstResult.mediaType || mediaType;

      // Get detailed info
      if (type === 'movie') {
        return await tmdbService.getMovieDetails(firstResult.id).catch(() => null);
      } else if (type === 'tv') {
        return await tmdbService.getTVDetails(firstResult.id).catch(() => null);
      } else if (type === 'person') {
        return await tmdbService.getPersonDetails(firstResult.id).catch(() => null);
      }
    }
  } catch (error) {
    console.error('Error fetching media context:', error);
  }
  return null;
}

/**
 * Fetch community/discussion context
 */
async function fetchCommunityContext(_message) {
  try {
    // Also get trending posts
    await connectDB();
    const trendingPosts = await Post.aggregate([
      { $match: { isApproved: true, isFlagged: { $ne: true } } },
      {
        $addFields: {
          engagementScore: {
            $add: [
              { $multiply: [{ $size: { $ifNull: ['$likes', []] } }, 3] },
              { $multiply: [{ $size: { $ifNull: ['$comments', []] } }, 2] }
            ]
          }
        }
      },
      { $sort: { engagementScore: -1, createdAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'communities',
          localField: 'community',
          foreignField: '_id',
          as: 'communityInfo'
        }
      },
      { $unwind: { path: '$communityInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          title: 1,
          content: { $substrCP: [{ $ifNull: ['$content', ''] }, 0, 150] },
          likes: { $size: { $ifNull: ['$likes', []] } },
          communityName: '$communityInfo.name'
        }
      }
    ]);

    return { trendingPosts };
  } catch (error) {
    console.error('Error fetching community context:', error);
    return null;
  }
}

/**
 * Fetch trending context
 */
async function fetchTrendingContext() {
  const cacheKey = buildCacheKey('ai-context', 'trending');

  return remember(cacheKey, CONTEXT_CACHE_TTL, async () => {
    try {
      const [movies, tv, posts] = await Promise.all([
        tmdbService.getTrending('movie', 'day').catch(() => []),
        tmdbService.getTrending('tv', 'day').catch(() => []),
        fetchTrendingPosts()
      ]);

      return {
        movies: formatMediaList(movies, 10),
        tv: formatMediaList(tv, 10),
        posts
      };
    } catch (error) {
      console.error('Error fetching trending context:', error);
      return null;
    }
  });
}

/**
 * Fetch explanation context (RAG disabled)
 */
async function fetchExplanationContext(_message) {
  try {
    return null;
  } catch (error) {
    console.error('Error fetching explanation context:', error);
    return null;
  }
}


/**
 * Get basic platform context
 */
function getPlatformContext() {
  return {
    features: ['Communities', 'Watchlist', 'Favorites', 'Reviews', 'Leaderboard', 'Recommendations'],
    actions: ['Add to watchlist', 'Rate movies', 'Write reviews', 'Create communities', 'Join communities', 'Follow users']
  };
}

/**
 * Get detailed platform context for guidance
 */
function getDetailedPlatformContext() {
  return {
    navigation: {
      profile: 'Click avatar > Profile',
      watchlist: 'Profile > Watchlist tab OR Navigation > Watchlist',
      communities: 'Navigation bar > Communities',
      reviews: 'Any movie/TV page > Scroll to Reviews section',
      settings: 'Click avatar > Settings',
      leaderboard: 'Navigation > Leaderboard'
    },
    features: {
      communities: 'Join topic-based groups for movies, TV shows, actors. Create posts, discuss, and connect with fans.',
      watchlist: 'Save movies and shows you want to watch. Access from your profile.',
      favorites: 'Mark your all-time favorite titles. Shows on your profile.',
      reviews: 'Rate (0-10) and review any movie or TV show. Mark spoilers if needed.',
      gamification: 'Earn XP for activity. Level up, unlock badges, climb the leaderboard.',
      recommendations: 'Get personalized suggestions based on your ratings and watch history.'
    },
    howTo: {
      writeReview: '1. Go to movie/show page → 2. Scroll to Reviews → 3. Click "Write Review" → 4. Rate & write → 5. Submit',
      joinCommunity: '1. Go to Communities → 2. Browse/search → 3. Open community → 4. Click "Join"',
      createCommunity: '1. Log in → 2. Open Communities from the main navigation → 3. Click "Create Community" (top-right) → 4. Fill name, description, category, and optional media/person link → 5. Submit to publish',
      createPost: '1. Join a community → 2. Open it → 3. Click "Create Post" → 4. Write content → 5. Submit',
      addToWatchlist: '1. Go to any movie/show page → 2. Click "Add to Watchlist" button'
    }
  };
}

/**
 * Fetch trending posts from communities
 */
async function fetchTrendingPosts() {
  try {
    await connectDB();

    const posts = await Post.aggregate([
      { $match: { isApproved: true } },
      {
        $addFields: {
          engagementScore: {
            $add: [
              { $multiply: [{ $size: { $ifNull: ['$likes', []] } }, 3] },
              { $multiply: [{ $size: { $ifNull: ['$comments', []] } }, 2] }
            ]
          }
        }
      },
      { $sort: { engagementScore: -1 } },
      { $limit: 5 },
      { $project: { title: 1, engagementScore: 1 } }
    ]);

    return posts;
  } catch (error) {
    return [];
  }
}

/**
 * Format media list for context
 */
function formatMediaList(items, limit = 5) {
  if (!Array.isArray(items)) return [];

  return items.slice(0, limit).map(item => ({
    id: item.id,
    title: item.title,
    year: item.releaseDate?.split('-')[0],
    rating: item.rating?.toFixed?.(1) || item.rating,
    overview: item.overview?.slice(0, 100)
  }));
}

/**
 * Convert genre names to TMDB IDs
 */
function getGenreIds(genres) {
  const genreMap = {
    action: 28, adventure: 12, animation: 16, comedy: 35,
    crime: 80, documentary: 99, drama: 18, family: 10751,
    fantasy: 14, history: 36, horror: 27, music: 10402,
    mystery: 9648, romance: 10749, 'sci-fi': 878, 'science fiction': 878,
    thriller: 53, war: 10752, western: 37
  };

  const ids = genres
    .map(g => genreMap[g.toLowerCase()])
    .filter(Boolean);

  return ids.length > 0 ? ids.join(',') : null;
}

