import { NextResponse } from 'next/server'
import tmdbService from '@/server/services/tmdb.service.js'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const person = await tmdbService.getPersonDetails(id)

    return NextResponse.json({
      success: true,
      data: person,
    })
  } catch (error) {
    console.error('getPersonDetails error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch person details',
      },
      { status: 500 }
    )
  }
}

export const revalidate = 7200 // 2 hours
