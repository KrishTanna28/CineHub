import { NextResponse } from 'next/server'
import Review from '@/lib/models/Review.js'
import { withAuth } from '@/lib/middleware/withAuth.js'

// GET /api/reviews - Get reviews with optional filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get('mediaId')
    const mediaType = searchParams.get('mediaType')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit')) || 10
    const page = parseInt(searchParams.get('page')) || 1
    const skip = (page - 1) * limit

    const query = {}
    if (mediaId) query.mediaId = mediaId
    if (mediaType) query.mediaType = mediaType
    if (userId) query.user = userId

    const reviews = await Review.find(query)
      .populate('user', 'username avatar fullName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)

    const total = await Review.countDocuments(query)

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    })
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get reviews'
      },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create a new review
export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json()
    const { mediaId, mediaType, mediaTitle, rating, title, content, spoiler } = body

    if (!mediaId || !mediaType || !mediaTitle || !rating || !title || !content) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already reviewed this media
    const existingReview = await Review.findOne({
      user: user.id,
      mediaId,
      mediaType
    })

    if (existingReview) {
      return NextResponse.json(
        { success: false, message: 'You have already reviewed this media' },
        { status: 400 }
      )
    }

    const review = new Review({
      mediaId,
      mediaType,
      mediaTitle,
      user: user.id,
      rating,
      title,
      content,
      spoiler: spoiler || false
    })

    await review.save()

    // Update user's reviews array and achievements
    user.reviews.push(review._id)
    user.achievements.reviewsWritten += 1
    await user.save()

    // Populate user data before returning
    await review.populate('user', 'username avatar fullName')

    return NextResponse.json({
      success: true,
      message: 'Review created successfully',
      data: review
    })
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create review'
      },
      { status: 500 }
    )
  }
})
