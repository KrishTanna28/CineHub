import { NextResponse } from 'next/server'
import User from '@/lib/models/User.js'
import Review from '@/lib/models/Review.js'
import connectDB from '@/lib/config/database.js'

await connectDB()

// GET /api/users/[id] - Get public user profile by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 })
    }

    // Find user and exclude sensitive information
    const user = await User.findById(id)
      .select('-password -email -googleId -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire')
      .lean()

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    // Get user's review stats
    const reviewStats = await Review.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } }
        }
      }
    ])

    // Get recent reviews (public)
    const recentReviews = await Review.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('mediaId mediaType mediaTitle rating content createdAt mediaPoster')
      .lean()

    // Format reviews to have consistent field names
    const formattedReviews = recentReviews.map(review => ({
      _id: review._id,
      movieId: review.mediaId,
      mediaType: review.mediaType,
      title: review.mediaTitle,
      rating: review.rating,
      review: review.content,
      createdAt: review.createdAt,
      poster: review.mediaPoster
    }))

    // Calculate member duration
    const memberSince = user.createdAt
    const now = new Date()
    const diffTime = Math.abs(now - new Date(memberSince))
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const publicProfile = {
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      bio: user.bio,
      memberSince: user.createdAt,
      memberDays: diffDays,
      // Gamification stats (public)
      points: user.points || 0,
      level: user.level || 1,
      achievements: user.achievements || [],
      streak: user.streak || { current: 0, longest: 0 },
      // Review stats
      stats: {
        totalReviews: reviewStats[0]?.totalReviews || 0,
        averageRating: reviewStats[0]?.averageRating?.toFixed(1) || '0.0',
        totalLikes: reviewStats[0]?.totalLikes || 0
      },
      // Recent reviews
      recentReviews: formattedReviews,
      // Community stats
      favoriteGenres: user.favoriteGenres || [],
      watchlistCount: user.watchlist?.length || 0,
      favoritesCount: user.favorites?.length || 0
    }

    return NextResponse.json({
      success: true,
      data: publicProfile
    })
  } catch (error) {
    console.error('Get public profile error:', error)
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to get user profile'
    }, { status: 500 })
  }
}
