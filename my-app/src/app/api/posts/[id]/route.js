import { NextResponse } from 'next/server'
import Post from '@/lib/models/Post.js'
import { withAuth } from '@/lib/middleware/withAuth.js'
import connectDB from '@/lib/config/database.js'
import { deleteMultipleImagesFromCloudinary } from '@/lib/utils/cloudinaryHelper.js'

await connectDB()

// GET /api/posts/[id] - Get single post
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const post = await Post.findById(id)
      .populate('user', 'username avatar fullName')
      .populate('community', 'name slug icon')
      .populate('comments.user', 'username avatar fullName')

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      )
    }

    await post.incrementViews()

    return NextResponse.json({
      success: true,
      data: post
    })
  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch post'
      },
      { status: 500 }
    )
  }
}

// POST /api/posts/[id] - Like/dislike post
export const POST = withAuth(async (request, { user, params }) => {
  try {
    const { id } = await params
    const { action } = await request.json()

    const post = await Post.findById(id)
    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      )
    }

    const userId = user.id.toString()
    const likeIndex = post.likes.findIndex(id => id.toString() === userId)
    const dislikeIndex = post.dislikes.findIndex(id => id.toString() === userId)

    if (action === 'like') {
      // Remove from dislikes if present
      if (dislikeIndex > -1) {
        post.dislikes.splice(dislikeIndex, 1)
      }
      // Toggle like
      if (likeIndex > -1) {
        post.likes.splice(likeIndex, 1)
      } else {
        post.likes.push(user.id)
      }
    } else if (action === 'dislike') {
      // Remove from likes if present
      if (likeIndex > -1) {
        post.likes.splice(likeIndex, 1)
      }
      // Toggle dislike
      if (dislikeIndex > -1) {
        post.dislikes.splice(dislikeIndex, 1)
      } else {
        post.dislikes.push(user.id)
      }
    }

    await post.save()

    return NextResponse.json({
      success: true,
      data: {
        likes: post.likes.length,
        dislikes: post.dislikes.length,
        userLiked: post.likes.some(id => id.toString() === userId),
        userDisliked: post.dislikes.some(id => id.toString() === userId)
      }
    })
  } catch (error) {
    console.error('Vote post error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to vote on post'
      },
      { status: 500 }
    )
  }
})

// DELETE /api/posts/[id] - Delete post
export const DELETE = withAuth(async (request, { user, params }) => {
  try {
    const { id } = await params

    const post = await Post.findById(id).populate('community')
    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user owns post or is moderator
    const isModerator = post.community.isModerator(user.id)
    if (post.user.toString() !== user.id.toString() && !isModerator) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete images from Cloudinary if any
    if (post.images && post.images.length > 0) {
      try {
        await deleteMultipleImagesFromCloudinary(post.images)
      } catch (imageError) {
        console.error('Image deletion error:', imageError)
        // Continue with post deletion even if image deletion fails
      }
    }

    await Post.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete post'
      },
      { status: 500 }
    )
  }
})
