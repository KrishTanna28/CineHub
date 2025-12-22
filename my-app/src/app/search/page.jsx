"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, Film, Tv, User } from "lucide-react"
import movieAPI from "@/lib/api/movies"
import { useRouter } from "next/navigation"
import useInfiniteScroll from "@/hooks/useInfiniteScroll"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)
  const router = useRouter()

  // Infinite scroll
  const loadMoreRef = useInfiniteScroll(
    () => loadMore(),
    currentPage < totalPages,
    isLoading,
    200
  )

  useEffect(() => {
    if (query) {
      performSearch(query, 1)
    } else {
      // If no query, redirect to home page
      router.push("/")
    }
  }, [query, router])

  const performSearch = async (searchTerm, page = 1, append = false) => {
    if (!searchTerm.trim()) return

    setIsLoading(true)
    try {
      const data = await movieAPI.searchMulti(searchTerm, page)
      
      if (append) {
        // Append new results to existing ones
        setResults(prev => [...prev, ...(data.data?.results || [])])
      } else {
        // Replace results (new search)
        setResults(data.data?.results || [])
      }
      
      setCurrentPage(data.data?.page || 1)
      setTotalPages(data.data?.totalPages || 0)
      setTotalResults(data.data?.totalResults || 0)
    } catch (error) {
      console.error("Search failed:", error)
      if (!append) {
        setResults([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadMore = () => {
    if (currentPage < totalPages) {
      performSearch(query, currentPage + 1, true) // true = append results
    }
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Search Results */}
        {query && (
          <div className="mb-6">
            <p className="text-muted-foreground">
              {isLoading ? (
                "Searching..."
              ) : totalResults > 0 ? (
                <>
                  Found <span className="text-primary font-semibold">{totalResults}</span> results for{" "}
                  <span className="text-foreground font-semibold">"{query}"</span>
                </>
              ) : (
                <>
                  No results found for <span className="text-foreground font-semibold">"{query}"</span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && results.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Searching...</p>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && results.length > 0 && (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
              {results.map((item) => {
                const detailsPath = item.mediaType === 'person' 
                  ? `/actor/${item.id}` 
                  : item.mediaType === 'tv' 
                  ? `/tv/${item.id}` 
                  : `/details/${item.id}`
                
                return (
                  <Link
                    key={`${item.mediaType}-${item.id}`}
                    href={detailsPath}
                    className="group cursor-pointer"
                  >
                  <div className="relative overflow-hidden rounded-lg mb-3 aspect-[2/3] bg-secondary">
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.mediaType === 'person' ? (
                          <User className="w-16 h-16 text-muted-foreground" />
                        ) : item.mediaType === 'tv' ? (
                          <Tv className="w-16 h-16 text-muted-foreground" />
                        ) : (
                          <Film className="w-16 h-16 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    
                    {/* Media Type Badge */}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-bold uppercase">
                        {item.mediaType === 'person' ? 'Actor' : item.mediaType === 'tv' ? 'TV' : 'Movie'}
                      </span>
                    </div>

                    {/* Rating Badge - Only for movies/TV */}
                    {item.rating > 0 && item.mediaType !== 'person' && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-black/70 text-white rounded text-xs font-medium">
                          ⭐ {item.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.mediaType === 'person' 
                        ? (item.knownFor || 'Actor/Actress')
                        : (item.releaseDate?.split('-')[0] || 'N/A')}
                    </p>
                  </div>
                </Link>
                )
              })}
            </div>

            {/* Infinite Scroll Trigger & Loading Indicator */}
            {currentPage < totalPages && (
              <div ref={loadMoreRef} className="flex justify-center mt-12 py-8">
                {isLoading && (
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-muted-foreground text-sm">Loading more results...</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !query && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-20 h-20 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No Search Query</h2>
            <p className="text-muted-foreground max-w-md">
              Use the search bar in the navigation to find movies, TV shows, and actors
            </p>
          </div>
        )}

        {/* No Results State */}
        {!isLoading && query && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-20 h-20 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No Results Found</h2>
            <p className="text-muted-foreground max-w-md">
              We couldn't find any movies, TV shows, or actors matching "{query}". Try different keywords or check your spelling.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
