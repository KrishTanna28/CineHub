import { NextResponse } from 'next/server'
import { withAuth } from '@/server/middleware/withAuth.js'

// GET /api/users/me/stats - Get user statistics
export const GET = withAuth(async (request, { user }) => {
  try {
    const stats = {
      points: user.points,
      level: user.level,
      achievements: user.achievements,
      streaks: user.streaks,
      watchlistCount: user.watchlist.length,
      favoritesCount: user.favorites.length,
      reviewsCount: user.reviews.length,
      ratingsCount: user.ratings.length,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      badges: user.badges
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get stats'
      },
      { status: 500 }
    )
  }
})
