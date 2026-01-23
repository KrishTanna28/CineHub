import { NextResponse } from 'next/server'
import Review from '@/lib/models/Review.js'
import { withAuth } from '@/lib/middleware/withAuth.js'

// POST /api/reviews/[reviewId]/like - Like/unlike a review
export const POST = withAuth(async (request, { user, params }) => {
  try {
    const { reviewId } = await params

    const review = await Review.findById(reviewId)

    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      )
    }

    // Use the model method to toggle like
    await review.likeReview(user._id)

    return NextResponse.json({
      success: true,
      message: 'Review like toggled',
      data: {
        likes: review.likes.length,
        dislikes: review.dislikes.length,
        userLiked: review.likes.some(id => id?.toString() === user._id?.toString()),
        userDisliked: review.dislikes.some(id => id?.toString() === user._id?.toString())
      }
    })
  } catch (error) {
    console.error('Like review error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to like review'
      },
      { status: 500 }
    )
  }
})
