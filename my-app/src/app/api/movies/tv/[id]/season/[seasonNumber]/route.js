import { NextResponse } from 'next/server'
import tmdbService from '@/server/services/tmdb.service.js'

export async function GET(request, { params }) {
  try {
    const { id, seasonNumber } = params
    const season = await tmdbService.getTVSeasonDetails(id, parseInt(seasonNumber))

    return NextResponse.json({
      success: true,
      data: season,
    })
  } catch (error) {
    console.error('getTVSeasonDetails error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch season details',
      },
      { status: 500 }
    )
  }
}

export const revalidate = 7200 // 2 hours
