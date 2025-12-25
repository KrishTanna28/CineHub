import { NextResponse } from 'next/server'
import { searchMulti } from '@/lib/services/tmdb.service.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          message: 'Search query is required',
        },
        { status: 400 }
      )
    }

    const data = await searchMulti(query, page)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('searchMulti error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to search content',
      },
      { status: 500 }
    )
  }
}

export const revalidate = 1800 // 30 minutes