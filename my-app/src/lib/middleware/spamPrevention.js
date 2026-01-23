import Review from '../models/Review.js';
import User from '../models/User.js';

/**
 * Spam Prevention Middleware
 * Prevents users from spamming reviews/replies while allowing legitimate multiple posts
 */

// In-memory cache for rate limiting (use Redis in production)
const rateLimitCache = new Map();

/**
 * Check if user is spamming reviews
 */
export const preventReviewSpam = async (req, res, next) => {
  try {
    const userId = req.user._id?.toString();
    const { mediaId, content, title } = req.body;

    // 1. Rate Limiting - Max reviews per time period
    const reviewRateLimit = await checkReviewRateLimit(userId);
    if (!reviewRateLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: `Too many reviews. Please wait ${reviewRateLimit.waitTime} before posting again.`,
        retryAfter: reviewRateLimit.waitTime
      });
    }

    // 2. Check for similar content across different media (copy-paste spam)
    // Note: Duplicate review check (same media) is handled by the controller
    const recentReviews = await Review.find({ 
      user: userId 
    })
    .sort({ createdAt: -1 })
    .limit(5);

    const isCopyPaste = checkSimilarContent(content, recentReviews);
    if (isCopyPaste) {
      return res.status(400).json({
        success: false,
        message: 'This review appears to be very similar to your recent reviews. Please write unique content for each review.'
      });
    }

    // 3. Check for rapid-fire posting (suspicious behavior)
    const rapidFireCheck = await checkRapidFire(userId);
    if (!rapidFireCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: `Please slow down. Wait ${rapidFireCheck.waitTime} between reviews.`,
        retryAfter: rapidFireCheck.waitTime
      });
    }

    // 4. Check user's spam history
    const user = await User.findById(userId);
    if (user.spamScore && user.spamScore > 80) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been flagged for spam. Please contact support.'
      });
    }

    // Update rate limit cache
    updateRateLimitCache(userId, 'review');

    next();
  } catch (error) {
    console.error('Spam prevention error:', error);
    // Don't block on error, just log it
    next();
  }
};

/**
 * Check if user is spamming replies
 */
export const preventReplySpam = async (req, res, next) => {
  try {
    const userId = req.user._id?.toString();
    const { content } = req.body;
    const reviewId = req.params.reviewId;

    // 1. Rate Limiting - Max replies per time period
    const replyRateLimit = await checkReplyRateLimit(userId);
    if (!replyRateLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: `Too many replies. Please wait ${replyRateLimit.waitTime} before posting again.`,
        retryAfter: replyRateLimit.waitTime
      });
    }

    // 2. Check for duplicate replies on same review
    const review = await Review.findById(reviewId);
    if (review) {
      const userReplies = review.replies.filter(r => 
        r.user.toString() === userId
      );

      // Check if user already replied recently (within 1 minute)
      const recentReply = userReplies.find(r => {
        const timeDiff = Date.now() - new Date(r.createdAt).getTime();
        return timeDiff < 60000; // 1 minute
      });

      if (recentReply) {
        return res.status(429).json({
          success: false,
          message: 'Please wait at least 1 minute between replies to the same review.'
        });
      }

      // Check for identical content
      const identicalReply = userReplies.find(r => 
        r.content.toLowerCase().trim() === content.toLowerCase().trim()
      );

      if (identicalReply) {
        return res.status(400).json({
          success: false,
          message: 'You have already posted this exact reply.'
        });
      }
    }

    // 3. Check for rapid-fire replies
    const rapidFireCheck = await checkRapidFire(userId, 'reply');
    if (!rapidFireCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: `Please slow down. Wait ${rapidFireCheck.waitTime} between replies.`,
        retryAfter: rapidFireCheck.waitTime
      });
    }

    // Update rate limit cache
    updateRateLimitCache(userId, 'reply');

    next();
  } catch (error) {
    console.error('Reply spam prevention error:', error);
    next();
  }
};

/**
 * Check review rate limit
 * Max 10 reviews per hour
 */
async function checkReviewRateLimit(userId) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const recentReviews = await Review.countDocuments({
    user: userId,
    createdAt: { $gte: oneHourAgo }
  });

  const maxReviewsPerHour = 10;
  
  if (recentReviews >= maxReviewsPerHour) {
    return {
      allowed: false,
      waitTime: '1 hour'
    };
  }

  return { allowed: true };
}

/**
 * Check reply rate limit
 * Max 30 replies per hour
 */
async function checkReplyRateLimit(userId) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const reviews = await Review.find({
    'replies.user': userId,
    'replies.createdAt': { $gte: oneHourAgo }
  });

  let recentReplies = 0;
  reviews.forEach(review => {
    recentReplies += review.replies.filter(r => 
      r.user.toString() === userId && 
      new Date(r.createdAt) >= oneHourAgo
    ).length;
  });

  const maxRepliesPerHour = 30;
  
  if (recentReplies >= maxRepliesPerHour) {
    return {
      allowed: false,
      waitTime: '1 hour'
    };
  }

  return { allowed: true };
}

/**
 * Check for rapid-fire posting
 * Minimum 30 seconds between reviews, 10 seconds between replies
 */
async function checkRapidFire(userId, type = 'review') {
  const cacheKey = `${userId}_last_${type}`;
  const lastPost = rateLimitCache.get(cacheKey);

  if (!lastPost) {
    return { allowed: true };
  }

  const timeSinceLastPost = Date.now() - lastPost;
  const minInterval = type === 'review' ? 30000 : 10000; // 30s for reviews, 10s for replies

  if (timeSinceLastPost < minInterval) {
    const waitSeconds = Math.ceil((minInterval - timeSinceLastPost) / 1000);
    return {
      allowed: false,
      waitTime: `${waitSeconds} seconds`
    };
  }

  return { allowed: true };
}

/**
 * Update rate limit cache
 */
function updateRateLimitCache(userId, type) {
  const cacheKey = `${userId}_last_${type}`;
  rateLimitCache.set(cacheKey, Date.now());

  // Clean up old entries (older than 1 hour)
  if (rateLimitCache.size > 1000) {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [key, timestamp] of rateLimitCache.entries()) {
      if (timestamp < oneHourAgo) {
        rateLimitCache.delete(key);
      }
    }
  }
}

/**
 * Check if content is similar to recent reviews (copy-paste detection)
 */
function checkSimilarContent(newContent, recentReviews) {
  if (!newContent || recentReviews.length === 0) {
    return false;
  }

  const newWords = new Set(
    newContent.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3) // Only words longer than 3 chars
  );

  for (const review of recentReviews) {
    const reviewWords = new Set(
      review.content.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
    );

    // Calculate similarity (Jaccard index)
    const intersection = new Set([...newWords].filter(x => reviewWords.has(x)));
    const union = new Set([...newWords, ...reviewWords]);
    
    const similarity = intersection.size / union.size;

    // If more than 70% similar, it's likely copy-paste
    if (similarity > 0.7) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate user's spam score (0-100)
 * Higher score = more likely to be spammer
 */
export async function calculateSpamScore(userId) {
  try {
    const user = await User.findById(userId);
    const reviews = await Review.find({ user: userId });

    let score = 0;

    // Factor 1: Removed reviews ratio
    const removedReviews = reviews.filter(r => r.isRemoved).length;
    const removalRatio = reviews.length > 0 ? removedReviews / reviews.length : 0;
    score += removalRatio * 40; // Up to 40 points

    // Factor 2: Flagged reviews ratio
    const flaggedReviews = reviews.filter(r => r.isFlagged).length;
    const flagRatio = reviews.length > 0 ? flaggedReviews / reviews.length : 0;
    score += flagRatio * 30; // Up to 30 points

    // Factor 3: Negative engagement ratio
    let totalLikes = 0;
    let totalDislikes = 0;
    reviews.forEach(r => {
      totalLikes += r.likeCount || 0;
      totalDislikes += r.dislikeCount || 0;
    });
    const totalVotes = totalLikes + totalDislikes;
    if (totalVotes > 10) {
      const dislikeRatio = totalDislikes / totalVotes;
      score += dislikeRatio * 20; // Up to 20 points
    }

    // Factor 4: Duplicate content flag
    if (user.hasDuplicateContent) {
      score += 10;
    }

    // Update user's spam score
    user.spamScore = Math.min(100, Math.round(score));
    await user.save();

    return user.spamScore;
  } catch (error) {
    console.error('Calculate spam score error:', error);
    return 0;
  }
}

// Named exports `preventReviewSpam`, `preventReplySpam`, and `calculateSpamScore` are provided above
