"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import useInfiniteScroll from "@/hooks/useInfiniteScroll"

export default function RecommendationCarousel({ 
  title, 
  movies, 
  description, 
  requireAuth = false,
  onLoadMore = null,
  hasMore = false,
  isLoadingMore = false 
}) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const router = useRouter()
  const loadMoreRef = useInfiniteScroll(
    () => {
      if (onLoadMore && hasMore && !isLoadingMore) {
        onLoadMore()
      }
    },
    hasMore,
    isLoadingMore,
    300 // Trigger 300px before the end
  )

  const scroll = (direction) => {
    const container = document.getElementById(`carousel-${title}`)
    if (container) {
      const scrollAmount = 400
      const newPosition = direction === "left" ? scrollPosition - scrollAmount : scrollPosition + scrollAmount
      container.scrollLeft = newPosition
      setScrollPosition(newPosition)
    }
  }

  return (
    <section className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      <div className="relative group">
        <div
          id={`carousel-${title}`}
          className="carousel-container flex gap-3 overflow-x-auto scroll-smooth pb-4"
          style={{ scrollBehavior: "smooth" }}
        >
          {movies.map((movie) => (
            requireAuth ? (
              <div 
                key={movie.id} 
                onClick={() => router.push('/login')}
                className="cursor-pointer"
              >
                <div className="flex-shrink-0 w-36 poster-card group">
                  <img
                    src={movie.poster || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-54 rounded-lg object-cover"
                  />
                  <div className="poster-overlay">
                    <div className="w-full">
                      {movie.mediaType && (
                        <span className="inline-block px-2 py-0.5 bg-primary text-primary-foreground rounded text-xs font-bold uppercase mb-1">
                          {movie.mediaType === 'tv' ? 'TV' : 'Movie'}
                        </span>
                      )}
                      <h3 className="font-bold text-white mb-2 line-clamp-2">{movie.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="rating-badge">{movie.rating?.toFixed(1)}</span>
                        <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                          {movie.releaseDate?.split('-')[0] || movie.year}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link 
                key={movie.id} 
                href={movie.mediaType === 'tv' ? `/tv/${movie.id}` : `/details/${movie.id}`} 
                className="cursor-pointer"
              >
                <div className="flex-shrink-0 w-36 poster-card group">
                  <img
                    src={movie.poster || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-54 rounded-lg object-cover"
                  />
                  <div className="poster-overlay">
                    <div className="w-full">
                      {movie.mediaType && (
                        <span className="inline-block px-2 py-0.5 bg-primary text-primary-foreground rounded text-xs font-bold uppercase mb-1">
                          {movie.mediaType === 'tv' ? 'TV' : 'Movie'}
                        </span>
                      )}
                      <h3 className="font-bold text-white mb-2 line-clamp-2">{movie.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="rating-badge">{movie.rating?.toFixed(1)}</span>
                        <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                          {movie.releaseDate?.split('-')[0] || movie.year}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          ))}

          {/* Infinite Scroll Trigger & Loading Indicator */}
          {hasMore && onLoadMore && (
            <div ref={loadMoreRef} className="flex-shrink-0 w-36 h-54 flex items-center justify-center">
              {isLoadingMore && (
                <div className="w-full h-full bg-secondary/30 rounded-lg flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-muted-foreground text-sm font-medium">Loading...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons - Always visible on mobile, show on hover on desktop */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 bg-primary text-primary-foreground p-2 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow-lg"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 bg-primary text-primary-foreground p-2 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow-lg"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
    </section>
  )
}
