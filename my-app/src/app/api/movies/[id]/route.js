import { NextResponse } from 'next/server'
import tmdbService from '@/server/services/tmdb.service.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const movie = await tmdbService.getMovieDetails(id)

    return NextResponse.json({
      success: true,
      data: movie,
    })
  } catch (error) {
    console.error('getMovieDetails error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch movie details',
      },
      { status: 500 }
    )
  }
}

export const revalidate = 7200 // 2 hours
