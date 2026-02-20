import { NextResponse } from 'next/server'
import User from '@/lib/models/User.js'
import connectDB from '@/lib/config/database.js'
import { buildFuzzyMongoQuery } from '@/lib/utils/fuzzySearch.js'

await connectDB()

// GET /api/users/search - Search users
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('q') || searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!search.trim()) {
      return NextResponse.json({
        success: true,
        users: []
      })
    }

    // Use fuzzy matching to tolerate typos / misspellings
    const fuzzyQuery = buildFuzzyMongoQuery(search, ['username', 'fullName'])

    const users = await User.find(fuzzyQuery)
      .select('username fullName avatar points level bio')
      .limit(limit)
      .lean()

    return NextResponse.json({
      success: true,
      users
    })
  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to search users'
      },
      { status: 500 }
    )
  }
}
