import { Suspense } from "react"
import { cookies } from "next/headers"
import tmdbService from "@/server/services/tmdb.service.js"
import youtubeService from "@/server/services/youtube.service.js"
import newsService from "@/server/services/news.service.js"
import MovieDetailsClient from "@/components/movie-details-client"
import User from "@/server/models/User.js"
import { verifyToken } from "@/server/utils/jwt.js"
import connectDB from "@/server/config/database.js"

// Metadata for SEO
export async function generateMetadata({ params }) {
  const { id } = await params
  
  try {
    const movie = await tmdbService.getMovieDetails(id)
    return {
      title: `${movie.title} - CineHub`,
      description: movie.overview || `Watch ${movie.title} and discover more movies on CineHub`,
    }
  } catch (error) {
    return {
      title: 'Movie Details - CineHub',
      description: 'Discover movies on CineHub',
    }
  }
}

// Enable ISR - revalidate every 1 hour
export const revalidate = 3600

// Server Component - all data fetching happens on the server
export default async function MovieDetailsPage({ params }) {
  const { id } = await params
  
  // Get user from cookies (server-side)
  let user = null
  let userLiked = false
  let userInWatchlist = false

  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    
    if (token) {
      const decoded = await verifyToken(token)
      if (decoded?.userId) {
        await connectDB()
        user = await User.findById(decoded.userId).select('favorites watchlist').lean()
        
        if (user) {
          userLiked = user.favorites?.some(fav => fav.movieId === id) || false
          userInWatchlist = user.watchlist?.some(item => item.movieId === id) || false
        }
      }
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
  }

  // Fetch all data in parallel on the server
  const [movieData, videosData, newsData] = await Promise.all([
    tmdbService.getMovieDetails(id).catch(() => null),
    youtubeService.searchVideos(id).catch(() => ({ items: [] })),
    newsService.searchNews(id).catch(() => ({ articles: [] }))
  ])

  if (!movieData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Movie Not Found</h1>
          <p className="text-muted-foreground">The movie you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  // Get movie title for fetching related content
  const movieTitle = movieData.title

  // Fetch videos and news with movie title
  const [videos, news] = await Promise.all([
    youtubeService.searchVideos(movieTitle).catch(() => ({ items: [] })),
    newsService.searchNews(movieTitle).catch(() => ({ articles: [] }))
  ])

  return (
    <Suspense fallback={<MovieDetailsSkeleton />}>
      <MovieDetailsClient
        movie={movieData}
        initialLiked={userLiked}
        initialInWatchlist={userInWatchlist}
        videos={videos.items || []}
        news={news.articles || []}
      />
    </Suspense>
  )
}

// Loading skeleton
function MovieDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[70vh] min-h-[500px] bg-muted animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative container mx-auto px-4 h-full flex items-end pb-12">
          <div className="flex gap-8 w-full">
            <div className="w-64 h-96 bg-muted rounded-lg hidden md:block" />
            <div className="flex-1 space-y-4">
              <div className="h-12 bg-muted rounded w-2/3" />
              <div className="h-6 bg-muted rounded w-1/3" />
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-muted rounded-full" />
                <div className="h-8 w-20 bg-muted rounded-full" />
              </div>
              <div className="flex gap-3 pt-4">
                <div className="h-12 w-32 bg-muted rounded" />
                <div className="h-12 w-24 bg-muted rounded" />
                <div className="h-12 w-28 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
      </div>
    </div>
  )
}

// Loading UI
export function Loading() {
  return <MovieDetailsSkeleton />
}
