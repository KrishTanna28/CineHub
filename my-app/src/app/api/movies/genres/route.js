import { NextResponse } from 'next/server'
import tmdbService from '@/server/services/tmdb.service.js'

export async function GET(request) {
  try {
    const genres = await tmdbService.getGenres()

    return NextResponse.json({
      success: true,
      data: genres,
    })
  } catch (error) {
    console.error('getGenres error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch genres',
      },
      { status: 500 }
    )
  }
}

export const revalidate = 86400 // 24 hours
