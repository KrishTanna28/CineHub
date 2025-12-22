import { NextResponse } from 'next/server'
import tmdbService from '@/server/services/tmdb.service.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    
    const data = await tmdbService.getPopularTV(page)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('getPopularTV error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch popular TV shows',
      },
      { status: 500 }
    )
  }
}

export const revalidate = 3600 // 1 hour
