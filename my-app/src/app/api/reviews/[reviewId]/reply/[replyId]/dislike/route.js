import { NextResponse } from 'next/server'
import Review from '@/server/models/Review.js'
import { withAuth } from '@/server/middleware/withAuth.js'

// POST /api/reviews/[reviewId]/reply/[replyId]/dislike - Dislike/undislike a reply
export const POST = withAuth(async (request, { user, params }) => {
  try {
    const { reviewId, replyId } = await params

    const review = await Review.findById(reviewId)

    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      )
    }

    // Use the model method to toggle dislike on reply
    await review.dislikeReply(replyId, user._id)

    const reply = review.replies.id(replyId)

    return NextResponse.json({
      success: true,
      message: 'Reply dislike toggled',
      data: {
        likes: reply.likes.length,
        dislikes: reply.dislikes.length,
        userLiked: reply.likes.some(id => id.toString() === user._id.toString()),
        userDisliked: reply.dislikes.some(id => id.toString() === user._id.toString())
      }
    })
  } catch (error) {
    console.error('Dislike reply error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to dislike reply'
      },
      { status: 500 }
    )
  }
})
