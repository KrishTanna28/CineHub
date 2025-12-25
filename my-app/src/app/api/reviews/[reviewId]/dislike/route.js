import { NextResponse } from 'next/server'
import Review from '@/lib/models/Review.js'
import { withAuth } from '@/lib/middleware/withAuth.js'

// POST /api/reviews/[reviewId]/dislike - Dislike/undislike a review
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

    // Use the model method to toggle dislike
    await review.dislikeReview(user.id)

    return NextResponse.json({
      success: true,
      message: 'Review dislike toggled',
      data: {
        likes: review.likes.length,
        dislikes: review.dislikes.length,
        userLiked: review.likes.some(id => id.toString() === user.id.toString()),
        userDisliked: review.dislikes.some(id => id.toString() === user.id.toString())
      }
    })
  } catch (error) {
    console.error('Dislike review error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to dislike review'
      },
      { status: 500 }
    )
  }
})
