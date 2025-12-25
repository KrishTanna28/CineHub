import { NextResponse } from 'next/server'
import { searchTV } from '@/lib/services/tmdb.service.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
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

    const data = await searchTV(query, page)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('searchTV error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to search TV shows',
      },
      { status: 500 }
    )
  }
}

export const revalidate = 1800 // 30 minutes
