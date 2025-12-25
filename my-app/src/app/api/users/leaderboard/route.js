import { NextResponse } from 'next/server'
import User from '@/lib/models/User.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // Get top users by points
    const users = await User.find()
      .select('username fullName avatar points.total achievements badges')
      .sort({ 'points.total': -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await User.countDocuments()

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch leaderboard'
      },
      { status: 500 }
    )
  }
}

export const revalidate = 300 // 5 minutes
