"use client"

import { useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import useInfiniteScroll from "@/hooks/useInfiniteScroll"
import { InlineLoadingSkeleton } from "@/components/skeletons"

export default function RecommendationCarousel({
  title,
  movies = [],
  description,
  requireAuth = false,
  onLoadMore = null,
  hasMore = false,
  isLoadingMore = false
}) {
  const containerRef = useRef(null)
  const router = useRouter()

  // Filter duplicates by unique id + mediaType
  const uniqueMovies = movies.filter(
    (m, i, self) =>
      i === self.findIndex(t => t.id === m.id && t.mediaType === m.mediaType)
  )

  const loadMoreRef = useInfiniteScroll(
    () => {
      if (onLoadMore && hasMore && !isLoadingMore) onLoadMore()
    },
    hasMore,
    isLoadingMore,
    300
  )

  const scroll = useCallback((direction) => {
    const container = containerRef.current
    if (!container) return
    const scrollAmount = 400
    const newPosition = direction === "left"
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount
    container.scrollTo({ left: newPosition, behavior: "smooth" })
  }, [])

  return (
    <section className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      <div className="relative group">
        <div
          ref={containerRef}
          className="carousel-container flex gap-3 overflow-x-auto pb-4 touch-pan-x"
          style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
        >
          {uniqueMovies.map((movie, index) => {
            const key = `${movie.mediaType || "movie"}-${movie.id}-${index}`

            const detailHref = movie.mediaType === "tv"
              ? `/tv/${movie.id}`
              : `/movies/${movie.id}`

            const card = (
              <div className="flex-shrink-0 w-36">
                <div className="poster-card group/card">
                  <img
                    src={movie.poster || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-54 rounded-lg object-cover"
                    draggable={false}
                  />
                  <div className="poster-overlay">
                    <div className="w-full">
                      {movie.mediaType && (
                        <span className="inline-block px-2 py-0.5 bg-primary text-primary-foreground rounded text-xs font-bold uppercase mb-1">
                          {movie.mediaType === "tv" ? "TV" : "Movie"}
                        </span>
                      )}
                      <h3 className="font-bold text-white mb-2 line-clamp-2">
                        {movie.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="rating-badge">
                          {movie.rating?.toFixed(1)}
                        </span>
                        <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                          {movie.releaseDate?.split("-")[0] || movie.year}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* <div className="mt-1.5 px-0.5">
                  <h3 className="text-sm font-medium text-foreground line-clamp-1">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {movie.rating && (
                      <span className="text-xs text-primary font-medium">
                        {movie.rating.toFixed(1)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {movie.releaseDate?.split("-")[0] || movie.year}
                    </span>
                  </div>
                </div> */}
              </div>
            )

            return requireAuth ? (
              <div
                key={key}
                onClick={() => router.push("/login")}
                className="cursor-pointer touch-manipulation"
              >
                {card}
              </div>
            ) : (
              <Link
                key={key}
                href={detailHref}
                className="cursor-pointer touch-manipulation block"
                draggable={false}
              >
                {card}
              </Link>
            )
          })}

          {hasMore && onLoadMore && (
            <div
              ref={loadMoreRef}
              className="flex-shrink-0 w-36 h-54 flex items-center justify-center"
            >
              {isLoadingMore && (
                <InlineLoadingSkeleton count={2} />
              )}
            </div>
          )}
        </div>

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
