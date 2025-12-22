import { NextResponse } from 'next/server'
import tmdbService from '@/server/services/tmdb.service.js'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const tv = await tmdbService.getTVDetails(id)

    return NextResponse.json({
      success: true,
      data: tv,
    })
  } catch (error) {
    console.error('getTVDetails error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch TV show details',
      },
      { status: 500 }
    )
  }
}

export const revalidate = 7200 // 2 hours
