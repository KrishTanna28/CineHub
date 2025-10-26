"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Play, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import RecommendationCarousel from "@/components/recommendation-carousel"
import { useUser } from "@/contexts/UserContext"
import movieAPI from "@/lib/api/movies"
import Link from "next/link"

export default function Home() {
  const [liked, setLiked] = useState(false)
  const [popularMovies, setPopularMovies] = useState([])
  const [popularTV, setPopularTV] = useState([])
  const [topRatedMovies, setTopRatedMovies] = useState([])
  const [topRatedTV, setTopRatedTV] = useState([])
  const [featuredItems, setFeaturedItems] = useState([])
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  
  // Pagination states
  const [pages, setPages] = useState({
    popularMovies: 1,
    popularTV: 1,
    topRatedMovies: 1,
    topRatedTV: 1
  })
  const [loadingMore, setLoadingMore] = useState({
    popularMovies: false,
    popularTV: false,
    topRatedMovies: false,
    topRatedTV: false
  })
  const [hasMore, setHasMore] = useState({
    popularMovies: true,
    popularTV: true,
    topRatedMovies: true,
    topRatedTV: true
  })
  
  const router = useRouter()
  const { user } = useUser()
  const isAuthenticated = !!user
  const featuredItem = featuredItems[currentFeaturedIndex] || null

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true)
        const [popularMoviesData, popularTVData, topRatedMoviesData, topRatedTVData] = await Promise.all([
          movieAPI.getPopular(1),
          movieAPI.getPopularTV(1),
          movieAPI.getTopRated(1),
          movieAPI.getTopRatedTV(1),
        ])

        setPopularMovies(popularMoviesData.data?.results || [])
        setPopularTV(popularTVData.data?.results || [])
        setTopRatedMovies(topRatedMoviesData.data?.results || [])
        setTopRatedTV(topRatedTVData.data?.results || [])

        // Update hasMore based on total pages
        setHasMore({
          popularMovies: popularMoviesData.data?.page < popularMoviesData.data?.totalPages,
          popularTV: popularTVData.data?.page < popularTVData.data?.totalPages,
          topRatedMovies: topRatedMoviesData.data?.page < topRatedMoviesData.data?.totalPages,
          topRatedTV: topRatedTVData.data?.page < topRatedTVData.data?.totalPages
        })

        // Create featured items array (10 items from popular movies)
        const featured = (popularMoviesData.data?.results || []).slice(0, 10)
        setFeaturedItems(featured)
      } catch (error) {
        console.error('Failed to fetch content:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (featuredItems.length === 0) return
  
      if (e.key === "ArrowRight") {
        setCurrentFeaturedIndex((prev) =>
          prev === featuredItems.length - 1 ? 0 : prev + 1
        )
      } else if (e.key === "ArrowLeft") {
        setCurrentFeaturedIndex((prev) =>
          prev === 0 ? featuredItems.length - 1 : prev - 1
        )
      }
    }
  
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [featuredItems.length])
  

  // Load more functions
  const loadMorePopularMovies = async () => {
    if (loadingMore.popularMovies || !hasMore.popularMovies) return
    
    setLoadingMore(prev => ({ ...prev, popularMovies: true }))
    try {
      const nextPage = pages.popularMovies + 1
      const data = await movieAPI.getPopular(nextPage)
      
      setPopularMovies(prev => [...prev, ...(data.data?.results || [])])
      setPages(prev => ({ ...prev, popularMovies: nextPage }))
      setHasMore(prev => ({ ...prev, popularMovies: data.data?.page < data.data?.totalPages }))
    } catch (error) {
      console.error('Failed to load more popular movies:', error)
    } finally {
      setLoadingMore(prev => ({ ...prev, popularMovies: false }))
    }
  }

  const loadMorePopularTV = async () => {
    if (loadingMore.popularTV || !hasMore.popularTV) return
    
    setLoadingMore(prev => ({ ...prev, popularTV: true }))
    try {
      const nextPage = pages.popularTV + 1
      const data = await movieAPI.getPopularTV(nextPage)
      
      setPopularTV(prev => [...prev, ...(data.data?.results || [])])
      setPages(prev => ({ ...prev, popularTV: nextPage }))
      setHasMore(prev => ({ ...prev, popularTV: data.data?.page < data.data?.totalPages }))
    } catch (error) {
      console.error('Failed to load more popular TV:', error)
    } finally {
      setLoadingMore(prev => ({ ...prev, popularTV: false }))
    }
  }

  const loadMoreTopRatedMovies = async () => {
    if (loadingMore.topRatedMovies || !hasMore.topRatedMovies) return
    
    setLoadingMore(prev => ({ ...prev, topRatedMovies: true }))
    try {
      const nextPage = pages.topRatedMovies + 1
      const data = await movieAPI.getTopRated(nextPage)
      
      setTopRatedMovies(prev => [...prev, ...(data.data?.results || [])])
      setPages(prev => ({ ...prev, topRatedMovies: nextPage }))
      setHasMore(prev => ({ ...prev, topRatedMovies: data.data?.page < data.data?.totalPages }))
    } catch (error) {
      console.error('Failed to load more top rated movies:', error)
    } finally {
      setLoadingMore(prev => ({ ...prev, topRatedMovies: false }))
    }
  }

  const loadMoreTopRatedTV = async () => {
    if (loadingMore.topRatedTV || !hasMore.topRatedTV) return
    
    setLoadingMore(prev => ({ ...prev, topRatedTV: true }))
    try {
      const nextPage = pages.topRatedTV + 1
      const data = await movieAPI.getTopRatedTV(nextPage)
      
      setTopRatedTV(prev => [...prev, ...(data.data?.results || [])])
      setPages(prev => ({ ...prev, topRatedTV: nextPage }))
      setHasMore(prev => ({ ...prev, topRatedTV: data.data?.page < data.data?.totalPages }))
    } catch (error) {
      console.error('Failed to load more top rated TV:', error)
    } finally {
      setLoadingMore(prev => ({ ...prev, topRatedTV: false }))
    }
  }

  // Auto-rotate featured content every 5 seconds
  useEffect(() => {
    if (featuredItems.length === 0) return

    const interval = setInterval(() => {
      setCurrentFeaturedIndex((prevIndex) => 
        prevIndex === featuredItems.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [featuredItems.length])

  const handleAction = (action) => {
    if (!isAuthenticated) {
      router.push('/login')
    } else {
      // Handle authenticated action
      console.log(action)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading movies...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section - extends behind navbar */}
      {featuredItem && (
        <section className="relative h-[70vh] sm:h-screen flex items-end pb-16 sm:pb-32 overflow-hidden -mt-16 cursor-pointer">
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
            style={{
              backgroundImage: `url('${featuredItem.backdrop}')`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          <Link 
            href={featuredItem.mediaType === 'tv' ? `/tv/${featuredItem.id}` : `/details/${featuredItem.id}`}
            className="relative z-10 w-full cursor-pointer group"
          >
            <div className="max-w-2xl px-4 sm:px-6 lg:px-8 sm:ml-8 lg:ml-12">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase">
                  {featuredItem.mediaType === 'tv' ? 'TV Show' : 'Movie'}
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-3 sm:mb-4 text-balance leading-tight group-hover:text-primary transition-colors">{featuredItem.title}</h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3">{featuredItem.overview}</p>

              <div className="flex flex-wrap gap-2 mb-4 mt-4 sm:mt-10">
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                  ⭐ {featuredItem.rating?.toFixed(1)}
                </span>
                <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                  {featuredItem.releaseDate?.split('-')[0]}
                </span>
              </div>
            </div>
          </Link>

            {/* Featured navigation dots - centered across full page width */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10 mt-20">
              {featuredItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeaturedIndex(index)}
                  className={`h-1 rounded-full transition-all ${
                    index === currentFeaturedIndex 
                      ? 'w-8 bg-primary' 
                      : 'w-1 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to featured item ${index + 1}`}
                />
              ))}
            </div>
        </section>
      )}

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {popularMovies.length > 0 && (
          <RecommendationCarousel
            title="Popular Movies"
            movies={popularMovies}
            description="Discover amazing movies"
            requireAuth={!isAuthenticated}
            onLoadMore={loadMorePopularMovies}
            hasMore={hasMore.popularMovies}
            isLoadingMore={loadingMore.popularMovies}
          />
        )}

        {popularTV.length > 0 && (
          <RecommendationCarousel
            title="Popular TV Shows"
            movies={popularTV}
            description="Binge-worthy TV series"
            requireAuth={!isAuthenticated}
            onLoadMore={loadMorePopularTV}
            hasMore={hasMore.popularTV}
            isLoadingMore={loadingMore.popularTV}
          />
        )}

        {isAuthenticated && (
          <>
            {topRatedMovies.length > 0 && (
              <RecommendationCarousel
                title="Top Rated Movies"
                movies={topRatedMovies}
                description="Highest rated movies of all time"
                onLoadMore={loadMoreTopRatedMovies}
                hasMore={hasMore.topRatedMovies}
                isLoadingMore={loadingMore.topRatedMovies}
              />
            )}

            {topRatedTV.length > 0 && (
              <RecommendationCarousel
                title="Top Rated TV Shows"
                movies={topRatedTV}
                description="Critically acclaimed series"
                onLoadMore={loadMoreTopRatedTV}
                hasMore={hasMore.topRatedTV}
                isLoadingMore={loadingMore.topRatedTV}
              />
            )}
          </>
        )}
      </div>
    </main>
  )
}
