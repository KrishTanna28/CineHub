"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import RecommendationCarousel from "@/components/recommendation-carousel"
import { useUser } from "@/contexts/UserContext"
import * as movieAPI from "@/lib/movies"

export default function HomeClient({ initialData }) {
  const [popularMovies, setPopularMovies] = useState(initialData.popularMovies)
  const [popularTV, setPopularTV] = useState(initialData.popularTV)
  const [topRatedMovies, setTopRatedMovies] = useState(initialData.topRatedMovies)
  const [topRatedTV, setTopRatedTV] = useState(initialData.topRatedTV)
  const [featuredItems, setFeaturedItems] = useState(initialData.featuredItems)
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0)
  
  // Touch handling for mobile swipe
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  
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
    popularMovies: initialData.hasMore.popularMovies,
    popularTV: initialData.hasMore.popularTV,
    topRatedMovies: initialData.hasMore.topRatedMovies,
    topRatedTV: initialData.hasMore.topRatedTV
  })
  
  const { user } = useUser()
  const isAuthenticated = !!user
  const featuredItem = featuredItems[currentFeaturedIndex] || null

  // Keyboard navigation for featured items
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

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    
    if (isLeftSwipe && featuredItems.length > 0) {
      // Swipe left - next item
      setCurrentFeaturedIndex((prev) =>
        prev === featuredItems.length - 1 ? 0 : prev + 1
      )
    }
    
    if (isRightSwipe && featuredItems.length > 0) {
      // Swipe right - previous item
      setCurrentFeaturedIndex((prev) =>
        prev === 0 ? featuredItems.length - 1 : prev - 1
      )
    }
  }

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
    setHasMore(prev => ({
      ...prev,
      topRatedTV: data.data?.page < data.data?.totalPages
    }))
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

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section - extends behind navbar */}
      {featuredItem && (
        <section 
          className="relative h-[70vh] sm:h-screen flex items-end pb-16 sm:pb-32 overflow-hidden -mt-16 select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
            style={{
              backgroundImage: `url('${featuredItem.backdrop}')`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          <Link 
            href={user ? featuredItem.mediaType === 'tv' ? `/tv/${featuredItem.id}` : `/details/${featuredItem.id}` : "/login"}
            className="relative z-10 w-full cursor-pointer group"
            onClick={(e) => {
              // Prevent navigation if user was swiping
              if (Math.abs((touchStart || 0) - (touchEnd || 0)) > 50) {
                e.preventDefault()
              }
            }}
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
                   {featuredItem.rating?.toFixed(1)}
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
