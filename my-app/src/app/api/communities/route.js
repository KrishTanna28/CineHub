import { NextResponse } from 'next/server'
import Community from '@/lib/models/Community.js'
import { withAuth } from '@/lib/middleware/withAuth.js'
import connectDB from '@/lib/config/database.js'
import { uploadCommunityBannerToCloudinary, uploadCommunityIconToCloudinary } from '@/lib/utils/cloudinaryHelper.js'

await connectDB()

// GET /api/communities - Get all communities
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sort') || 'popular' // popular, recent, members
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const query = { isActive: true }
    if (category && category !== 'all') query.category = category
    if (search) {
      query.$text = { $search: search }
    }

    let sort = {}
    switch (sortBy) {
      case 'recent':
        sort = { createdAt: -1 }
        break
      case 'members':
        sort = { memberCount: -1, createdAt: -1 }
        break
      case 'popular':
      default:
        sort = { postCount: -1, memberCount: -1 }
        break
    }

    const skip = (page - 1) * limit

    const [communities, total] = await Promise.all([
      Community.find(query)
        .populate('creator', 'username avatar fullName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Community.countDocuments(query)
    ])

    return NextResponse.json({
      success: true,
      data: communities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get communities error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch communities'
      },
      { status: 500 }
    )
  }
}

// POST /api/communities - Create new community
export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json()
    const {
      name,
      description,
      category,
      relatedEntityId,
      relatedEntityName,
      relatedEntityType,
      banner,
      icon,
      isPrivate,
      requireApproval
    } = body

    // Validation
    if (!name || !description || !category) {
      return NextResponse.json(
        { success: false, message: 'Name, description, and category are required' },
        { status: 400 }
      )
    }

    // Check if community name already exists
    const existing = await Community.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A community with this name already exists' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Create community
    const community = await Community.create({
      name,
      slug,
      description,
      category,
      relatedEntityId,
      relatedEntityName,
      relatedEntityType,
      creator: user.id,
      moderators: [user.id],
      members: [user.id],
      isPrivate,
      requireApproval
    })

    // Upload images to Cloudinary if provided
    try {
      if (banner) {
        const bannerUrl = await uploadCommunityBannerToCloudinary(banner, community._id.toString())
        community.banner = bannerUrl
      }
      
      if (icon) {
        const iconUrl = await uploadCommunityIconToCloudinary(icon, community._id.toString())
        community.icon = iconUrl
      }

      if (banner || icon) {
        await community.save()
      }
    } catch (imageError) {
      console.error('Image upload error:', imageError)
      // Continue without images - community is already created
    }

    await community.populate('creator', 'username avatar fullName')

    return NextResponse.json({
      success: true,
      message: 'Community created successfully',
      data: community
    }, { status: 201 })
  } catch (error) {
    console.error('Create community error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create community'
      },
      { status: 500 }
    )
  }
})
