import { Suspense } from "react"
import tmdbService from "@/server/services/tmdb.service.js"
import HomeClient from "@/components/home-client"

// Metadata for SEO
export const metadata = {
  title: "Home - CineHub | Discover Movies & TV Shows",
  description: "Discover and explore popular movies, top-rated TV shows, and trending content on CineHub. Your ultimate destination for entertainment.",
}
// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600 // Revalidate every hour

// This is now a Server Component - data fetching happens on the server
export default async function Home() {
  // Fetch all data in parallel on the server using tmdbService directly
  const [popularMoviesData, popularTVData, topRatedMoviesData, topRatedTVData] = await Promise.all([
    tmdbService.getPopular(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    tmdbService.getPopularTV(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    tmdbService.getTopRated(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    tmdbService.getTopRatedTV(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
  ])

  // Prepare initial data for client component
  const initialData = {
    popularMovies: popularMoviesData?.results || [],
    popularTV: popularTVData?.results || [],
    topRatedMovies: topRatedMoviesData?.results || [],
    topRatedTV: topRatedTVData?.results || [],
    featuredItems: (popularMoviesData?.results || []).slice(0, 10),
    hasMore: {
      popularMovies: popularMoviesData?.page < popularMoviesData?.totalPages,
      popularTV: popularTVData?.page < popularTVData?.totalPages,
      topRatedMovies: topRatedMoviesData?.page < topRatedMoviesData?.totalPages,
      topRatedTV: topRatedTVData?.page < topRatedTVData?.totalPages,
    }
  }

  return <HomeClient initialData={initialData} />
}

// Loading UI for Suspense
export function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading movies...</p>
      </div>
    </div>
  )
}
