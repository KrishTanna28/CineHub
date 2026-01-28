import { NextResponse } from 'next/server'
import Post from '@/lib/models/Post.js'
import Community from '@/lib/models/Community.js'
import connectDB from '@/lib/config/database.js'

await connectDB()

// GET /api/communities/posts - Get all posts across all communities
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const sortBy = searchParams.get('sort') || 'recent'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // First, find communities matching the category filter
    let communityQuery = { isActive: true }
    if (category && category !== 'all') {
      communityQuery.category = category
    }

    const communityIds = await Community.find(communityQuery).distinct('_id')

    // Build post query
    let postQuery = { 
      community: { $in: communityIds },
      isApproved: true 
    }

    // If search is provided, search in title and content
    if (search) {
      postQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ]
    }

    let sort = {}
    switch (sortBy) {
      case 'top':
        sort = { score: -1, createdAt: -1 }
        break
      case 'hot':
        sort = { views: -1, createdAt: -1 }
        break
      case 'popular':
        sort = { likesCount: -1, createdAt: -1 }
        break
      case 'recent':
      default:
        sort = { createdAt: -1 }
        break
    }

    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      Post.find(postQuery)
        .populate('user', 'username avatar fullName')
        .populate('community', 'name slug icon category')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(postQuery)
    ])

    // Add computed fields
    const postsWithCounts = posts.map(post => ({
      ...post,
      likesCount: post.likes?.length || 0,
      dislikesCount: post.dislikes?.length || 0,
      commentsCount: post.comments?.length || 0
    }))

    return NextResponse.json({
      success: true,
      data: postsWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get all posts error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch posts'
      },
      { status: 500 }
    )
  }
}
