import Review from '../models/Review.js';
import User from '../models/User.js';
import PointsCalculator from '../utils/pointsCalculator.js';
import tmdbService from '../services/tmdb.service.js';
import moderationBot from '../services/moderationBot.js';

// Get reviews for a specific media (with pagination)
export const getReviews = async (req, res) => {
  try {
    const { mediaId, mediaType } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'recent'; // recent, popular, rating

    // Fetch user reviews from database
    let sortOptions = {};
    switch (sortBy) {
      case 'popular':
        sortOptions = { 'likes': -1, createdAt: -1 };
        break;
      case 'rating':
        sortOptions = { rating: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const userReviews = await Review.find({ 
      mediaId, 
      mediaType,
      isRemoved: { $ne: true }
    })
      .populate('user', 'username avatar')
      .populate('replies.user', 'username avatar')
      .sort(sortOptions);

    const totalUserReviews = userReviews.length;

    // Paginate user reviews only (TMDB reviews removed)
    const skip = (page - 1) * limit;
    const paginatedReviews = userReviews.slice(skip, skip + limit);
    const total = totalUserReviews;

    res.json({
      success: true,
      data: {
        reviews: paginatedReviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page < Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// Get a single review by ID
export const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id)
      .populate('user', 'username avatar')
      .populate('replies.user', 'username avatar');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review',
      error: error.message
    });
  }
};

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { mediaId, mediaType, mediaTitle, rating, title, content, spoiler } = req.body;
    const userId = req.user._id;

    // Check if user already reviewed this media
    const existingReview = await Review.findOne({ mediaId, mediaType, user: userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this content'
      });
    }

    const review = await Review.create({
      mediaId,
      mediaType,
      mediaTitle,
      user: userId,
      rating,
      title,
      content,
      spoiler: spoiler || false
    });

    // Populate user data
    await review.populate('user', 'username avatar');

    // Update user's achievements
    const user = await User.findById(userId);
    user.achievements.reviewsWritten += 1;

    // Calculate and award points
    const context = await getReviewContext(review);
    const pointsData = PointsCalculator.calculateReviewPoints(review, user, context);
    const finalPoints = Math.round(pointsData.total * pointsData.multiplier);

    user.points.total += finalPoints;
    user.points.available += finalPoints;

    // Update user stats
    await updateUserStats(user, review);

    // Check for level up
    const newLevel = PointsCalculator.getLevelFromPoints(user.points.total);
    const leveledUp = newLevel.level > user.level;
    if (leveledUp) {
      user.level = newLevel.level;
    }

    // Check for new badges
    const allBadges = PointsCalculator.calculateBadges(user);
    const newBadges = [];
    for (const badge of allBadges) {
      if (!user.badges.find(b => b.name === badge.name)) {
        user.badges.push({
          name: badge.name,
          icon: badge.icon,
          earnedAt: new Date()
        });
        newBadges.push(badge);
      }
    }

    await user.save();

    // Run AI moderation in background (don't wait for it)
    moderationBot.moderateReview(review, user).then(moderationResult => {
      if (moderationResult.success) {
        console.log('Moderation completed:', {
          reviewId: review._id,
          actions: moderationResult.actions
        });
      }
    }).catch(err => {
      console.error('Moderation failed:', err);
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review created successfully',
      points: {
        awarded: finalPoints,
        breakdown: pointsData.breakdown,
        multiplier: pointsData.multiplier,
        total: user.points.total,
        level: newLevel,
        leveledUp,
        newBadges
      }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message
    });
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, content, spoiler } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns this review
    if (!review.user.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews'
      });
    }

    // Update fields
    if (rating !== undefined) review.rating = rating;
    if (title) review.title = title;
    if (content) review.content = content;
    if (spoiler !== undefined) review.spoiler = spoiler;

    await review.save();
    await review.populate('user', 'username avatar');

    res.json({
      success: true,
      data: review,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns this review
    if (!review.user.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    await review.deleteOne();

    // Update user's achievements
    const user = await User.findById(userId);
    if (user.achievements.reviewsWritten > 0) {
      user.achievements.reviewsWritten -= 1;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

// Like a review
export const likeReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.likeReview(userId);
    await review.populate('user', 'username avatar');

    res.json({
      success: true,
      data: review,
      message: 'Review liked'
    });
  } catch (error) {
    console.error('Like review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like review',
      error: error.message
    });
  }
};

// Dislike a review
export const dislikeReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.dislikeReview(userId);
    await review.populate('user', 'username avatar');

    res.json({
      success: true,
      data: review,
      message: 'Review disliked'
    });
  } catch (error) {
    console.error('Dislike review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dislike review',
      error: error.message
    });
  }
};

// Add a reply to a review
export const addReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.addReply(userId, content);
    await review.populate('user', 'username avatar');
    await review.populate('replies.user', 'username avatar');

    // Update user's achievements
    const user = await User.findById(userId);
    user.achievements.commentsPosted += 1;
    await user.save();

    res.json({
      success: true,
      data: review,
      message: 'Reply added successfully'
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reply',
      error: error.message
    });
  }
};

// Like a reply
export const likeReply = async (req, res) => {
  try {
    const { id, replyId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.likeReply(replyId, userId);
    await review.populate('user', 'username avatar');
    await review.populate('replies.user', 'username avatar');

    res.json({
      success: true,
      data: review,
      message: 'Reply liked'
    });
  } catch (error) {
    console.error('Like reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like reply',
      error: error.message
    });
  }
};

// Dislike a reply
export const dislikeReply = async (req, res) => {
  try {
    const { id, replyId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.dislikeReply(replyId, userId);
    await review.populate('user', 'username avatar');
    await review.populate('replies.user', 'username avatar');

    res.json({
      success: true,
      data: review,
      message: 'Reply disliked'
    });
  } catch (error) {
    console.error('Dislike reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dislike reply',
      error: error.message
    });
  }
};

// Helper function to get review context
async function getReviewContext(review) {
  const context = {};

  // Get review rank (how early was this review)
  const earlierReviews = await Review.countDocuments({
    mediaId: review.mediaId,
    mediaType: review.mediaType,
    createdAt: { $lt: review.createdAt }
  });
  
  context.reviewRank = earlierReviews + 1;

  return context;
}

// Helper function to update user stats
async function updateUserStats(user, review) {
  // Update reviewed formats
  if (!user.reviewedFormats.includes(review.mediaType)) {
    user.reviewedFormats.push(review.mediaType);
  }

  // Update average review length
  const totalReviews = user.achievements.reviewsWritten + 1;
  const currentAvg = user.averageReviewLength || 0;
  user.averageReviewLength = Math.round(
    (currentAvg * (totalReviews - 1) + review.content.length) / totalReviews
  );

  // Update helpfulness ratio
  const userReviews = await Review.find({ user: user._id });
  let totalLikes = 0;
  let totalVotes = 0;
  
  for (const r of userReviews) {
    totalLikes += r.likeCount || 0;
    totalVotes += (r.likeCount || 0) + (r.dislikeCount || 0);
  }
  
  user.helpfulnessRatio = totalVotes > 0 ? totalLikes / totalVotes : 0;
  user.achievements.totalLikes = totalLikes;

  // Update streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = user.streaks.lastActivityDate;
  if (lastActivity) {
    const lastDate = new Date(lastActivity);
    lastDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      user.streaks.current += 1;
      if (user.streaks.current > user.streaks.longest) {
        user.streaks.longest = user.streaks.current;
      }
    } else if (daysDiff > 1) {
      // Streak broken
      user.streaks.current = 1;
    }
    // If daysDiff === 0, same day, don't increment
  } else {
    // First activity
    user.streaks.current = 1;
    user.streaks.longest = 1;
  }
  
  user.streaks.lastActivityDate = new Date();
}

// Get user's reviews
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ user: userId });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page < Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reviews',
      error: error.message
    });
  }
};
