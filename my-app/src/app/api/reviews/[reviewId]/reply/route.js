import { NextResponse } from 'next/server'
import Review from '@/lib/models/Review.js'
import User from '@/lib/models/User.js'
import { withAuth } from '@/lib/middleware/withAuth.js'

// POST /api/reviews/[reviewId]/reply - Add a reply to a review
export const POST = withAuth(async (request, { user, params }) => {
  try {
    const { reviewId } = await params
    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Reply content is required' },
        { status: 400 }
      )
    }

    const review = await Review.findById(reviewId)

    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      )
    }

    // Add reply using model method
    await review.addReply(user.id, content)

    // Update user achievements
    user.achievements.commentsPosted += 1
    await user.save()

    // Populate the review with user data
    await review.populate('replies.user', 'username avatar fullName')

    return NextResponse.json({
      success: true,
      message: 'Reply added successfully',
      data: review
    })
  } catch (error) {
    console.error('Add reply error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to add reply'
      },
      { status: 500 }
    )
  }
})
