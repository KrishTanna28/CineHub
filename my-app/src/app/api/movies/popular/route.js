import { NextResponse } from 'next/server'
import tmdbService from '@/server/services/tmdb.service.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    
    const data = await tmdbService.getPopular(page)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('getPopular error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch popular movies',
      },
      { status: 500 }
    )
  }
}

// Enable caching
export const revalidate = 3600 // 1 hour
