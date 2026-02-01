import { Suspense } from "react"
import { 
  getPopular, 
  getPopularTV, 
  getTopRated, 
  getTopRatedTV,
  getTrending,
  getNowPlaying,
  getUpcoming,
  getAiringTodayTV,
  getOnTheAirTV,
  getMoviesByGenre,
  getTVByGenre,
  getCriticallyAcclaimed,
  getHiddenGems,
  getDocumentaries,
  getTrendingMovies,
  getTrendingTV,
  getNewReleases,
  getFeelGoodMovies,
  getMindBendingMovies,
  getBingeWorthyTV,
  getAnime,
  getAnimeTV,
  getCrimeDramas,
  getBasedOnTrueStory,
} from "@/lib/services/tmdb.service.js"
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
  const [
    popularMoviesData,
    popularTVData,
    topRatedMoviesData,
    topRatedTVData,
    trendingData,
    nowPlayingData,
    upcomingData,
    airingTodayData,
    onTheAirData,
    // Genre-based content
    actionMoviesData,
    comedyMoviesData,
    horrorMoviesData,
    sciFiMoviesData,
    dramaMoviesData,
    romanceMoviesData,
    thrillerMoviesData,
    animationMoviesData,
    // TV genres
    dramaTVData,
    comedyTVData,
    sciFiTVData,
    // Special categories
    criticallyAcclaimedData,
    hiddenGemsData,
    documentariesData,
    trendingMoviesData,
    trendingTVData,
    newReleasesData,
    feelGoodData,
    mindBendingData,
    bingeWorthyData,
    animeMoviesData,
    animeTVData,
    crimeDramasData,
    trueStoryData,
  ] = await Promise.all([
    getPopular(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getPopularTV(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getTopRated(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getTopRatedTV(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getTrending('all', 'day').catch(() => []),
    getNowPlaying(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getUpcoming(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getAiringTodayTV(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getOnTheAirTV(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    // Genre IDs: Action=28, Comedy=35, Horror=27, Sci-Fi=878, Drama=18, Romance=10749, Thriller=53, Animation=16
    getMoviesByGenre(28, 1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getMoviesByGenre(35, 1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getMoviesByGenre(27, 1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getMoviesByGenre(878, 1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getMoviesByGenre(18, 1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getMoviesByGenre(10749, 1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getMoviesByGenre(53, 1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getMoviesByGenre(16, 1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    // TV genres: Drama=18, Comedy=35, Sci-Fi=10765
    getTVByGenre(18, 1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getTVByGenre(35, 1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getTVByGenre(10765, 1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    // Special categories
    getCriticallyAcclaimed(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getHiddenGems(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getDocumentaries(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getTrendingMovies('day', 1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getTrendingTV('day', 1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getNewReleases(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getFeelGoodMovies(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getMindBendingMovies(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getBingeWorthyTV(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getAnime(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getAnimeTV(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getCrimeDramas(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
    getBasedOnTrueStory(1).catch(() => ({ results: [], page: 1, totalPages: 1 })),
  ])

  // Prepare initial data for client component
  const initialData = {
    // Basic categories
    popularMovies: popularMoviesData?.results || [],
    popularTV: popularTVData?.results || [],
    topRatedMovies: topRatedMoviesData?.results || [],
    topRatedTV: topRatedTVData?.results || [],
    trending: trendingData || [],
    nowPlaying: nowPlayingData?.results || [],
    upcoming: upcomingData?.results || [],
    airingToday: airingTodayData?.results || [],
    onTheAir: onTheAirData?.results || [],
    featuredItems: (trendingData || popularMoviesData?.results || []).slice(0, 10),
    
    // Genre-based movies
    actionMovies: actionMoviesData?.results || [],
    comedyMovies: comedyMoviesData?.results || [],
    horrorMovies: horrorMoviesData?.results || [],
    sciFiMovies: sciFiMoviesData?.results || [],
    dramaMovies: dramaMoviesData?.results || [],
    romanceMovies: romanceMoviesData?.results || [],
    thrillerMovies: thrillerMoviesData?.results || [],
    animationMovies: animationMoviesData?.results || [],
    
    // Genre-based TV
    dramaTV: dramaTVData?.results || [],
    comedyTV: comedyTVData?.results || [],
    sciFiTV: sciFiTVData?.results || [],
    
    // Special categories
    criticallyAcclaimed: criticallyAcclaimedData?.results || [],
    hiddenGems: hiddenGemsData?.results || [],
    documentaries: documentariesData?.results || [],
    trendingMovies: trendingMoviesData?.results || [],
    trendingTV: trendingTVData?.results || [],
    newReleases: newReleasesData?.results || [],
    feelGoodMovies: feelGoodData?.results || [],
    mindBendingMovies: mindBendingData?.results || [],
    bingeWorthyTV: bingeWorthyData?.results || [],
    animeMovies: animeMoviesData?.results || [],
    animeTV: animeTVData?.results || [],
    crimeDramas: crimeDramasData?.results || [],
    basedOnTrueStory: trueStoryData?.results || [],
    
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
