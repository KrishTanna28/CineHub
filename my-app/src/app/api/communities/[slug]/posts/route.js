import { NextResponse } from 'next/server'
import Post from '@/lib/models/Post.js'
import Community from '@/lib/models/Community.js'
import { withAuth } from '@/lib/middleware/withAuth.js'
import connectDB from '@/lib/config/database.js'
import { uploadPostImagesToCloudinary } from '@/lib/utils/cloudinaryHelper.js'

await connectDB()

// GET /api/communities/[slug]/posts - Get posts in community
export async function GET(request, { params }) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sort') || 'recent'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const community = await Community.findOne({ slug })
    if (!community) {
      return NextResponse.json(
        { success: false, message: 'Community not found' },
        { status: 404 }
      )
    }

    let sort = {}
    switch (sortBy) {
      case 'top':
        sort = { score: -1, createdAt: -1 }
        break
      case 'hot':
        sort = { views: -1, createdAt: -1 }
        break
      case 'recent':
      default:
        sort = { createdAt: -1 }
        break
    }

    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      Post.find({ community: community._id, isApproved: true })
        .populate('user', 'username avatar fullName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({ community: community._id, isApproved: true })
    ])

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch posts'
      },
      { status: 500 }
    )
  }
}

// POST /api/communities/[slug]/posts - Create post in community
export const POST = withAuth(async (request, { user, params }) => {
  try {
    const { slug } = await params
    const body = await request.json()
    const { title, content, images } = body

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'Title is required' },
        { status: 400 }
      )
    }

    const community = await Community.findOne({ slug })
    if (!community) {
      return NextResponse.json(
        { success: false, message: 'Community not found' },
        { status: 404 }
      )
    }

    // Check if user is a member
    if (!community.isMember(user._id)) {
      return NextResponse.json(
        { success: false, message: 'Must be a member to post' },
        { status: 403 }
      )
    }

    // Create post
    const post = await Post.create({
      community: community._id,
      title,
      content,
      images: [],
      user: user._id
    })

    // Upload images to Cloudinary if provided
    if (images && images.length > 0) {
      try {
        const imageUrls = await uploadPostImagesToCloudinary(images, post._id?.toString())
        post.images = imageUrls
        await post.save()
      } catch (imageError) {
        console.error('Image upload error:', imageError)
        // Continue without images - post is already created
      }
    }

    // Update community post count
    community.postCount += 1
    await community.save()

    await post.populate('user', 'username avatar fullName')

    return NextResponse.json({
      success: true,
      message: 'Post created successfully',
      data: post
    }, { status: 201 })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create post'
      },
      { status: 500 }
    )
  }
})
