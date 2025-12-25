"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Film, Tv, User } from "lucide-react"
import { searchMulti } from "@/lib/movies"
import useInfiniteScroll from "@/hooks/useInfiniteScroll"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""

  const [results, setResults] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)

  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const loadMoreRef = useInfiniteScroll(
    () => loadMore(),
    currentPage < totalPages,
    isLoadingMore,
    200
  )

  useEffect(() => {
    if (query) {
      performSearch(query, 1, false)
    } else {
      router.push("/")
    }
  }, [query, router])

  const performSearch = async (searchTerm, page = 1, append = false) => {
    if (!searchTerm.trim()) return

    append ? setIsLoadingMore(true) : setIsInitialLoading(true)

    try {
      const data = await searchMulti(searchTerm, page)

      const newResults = data.data?.results || []

      setResults(prev => {
        const combined = append ? [...prev, ...newResults] : newResults

        const uniqueMap = new Map()
        combined.forEach(item => {
          uniqueMap.set(`${item.mediaType}-${item.id}`, item)
        })

        return Array.from(uniqueMap.values())
      })

      setCurrentPage(data.data?.page || 1)
      setTotalPages(data.data?.totalPages || 0)
      setTotalResults(data.data?.totalResults || 0)
    } catch (err) {
      console.error("Search failed:", err)
      if (!append) setResults([])
    } finally {
      append ? setIsLoadingMore(false) : setIsInitialLoading(false)
    }
  }

  const loadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      performSearch(query, currentPage + 1, true)
    }
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Search Info */}
        {query && !isInitialLoading && (
          <div className="mb-6">
            <p className="text-muted-foreground">
              {totalResults > 0 ? (
                <>
                  Found <span className="text-primary font-semibold">{totalResults}</span>{" "}
                  results for <span className="font-semibold">"{query}"</span>
                </>
              ) : (
                <>No results found for <span className="font-semibold">"{query}"</span></>
              )}
            </p>
          </div>
        )}

        {/* Initial Loading */}
        {isInitialLoading && results.length === 0 && (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Results */}
        {!isInitialLoading && results.length > 0 && (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
              {results.map(item => {
                const href =
                  item.mediaType === "person"
                    ? `/actor/${item.id}`
                    : item.mediaType === "tv"
                      ? `/tv/${item.id}`
                      : `/details/${item.id}`

                return (
                  <Link
                    key={`${item.mediaType}-${item.id}`}
                    href={href}
                    className="group"
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary mb-2">
                      {item.poster ? (
                        <img
                          src={item.poster}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          {item.mediaType === "person" ? (
                            <User className="w-16 h-16 text-muted-foreground" />
                          ) : item.mediaType === "tv" ? (
                            <Tv className="w-16 h-16 text-muted-foreground" />
                          ) : (
                            <Film className="w-16 h-16 text-muted-foreground" />
                          )}
                        </div>
                      )}

                      <div className="absolute top-2 left-2 text-xs px-2 py-1 bg-primary text-primary-foreground rounded">
                        {item.mediaType === "person"
                          ? "Actor"
                          : item.mediaType === "tv"
                            ? "TV"
                            : "Movie"}
                      </div>

                      {item.rating > 0 && item.mediaType !== "person" && (
                        <div className="absolute top-2 right-2 text-xs px-2 py-1 bg-black/70 text-white rounded">
                          ⭐ {item.rating.toFixed(1)}
                        </div>
                      )}
                    </div>

                    <h3 className="text-xs sm:text-sm font-semibold line-clamp-2 group-hover:text-primary">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {item.mediaType === "person"
                        ? item.knownFor || "Actor"
                        : item.releaseDate?.split("-")[0] || "N/A"}
                    </p>
                  </Link>
                )
              })}
            </div>

            {/* Infinite Scroll Loader */}
            {currentPage < totalPages && (
              <div ref={loadMoreRef} className="flex justify-center py-10">
                {isLoadingMore && (
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            )}
          </>
        )}

        {/* No Results */}
        {!isInitialLoading && query && results.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <Search className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold">No Results Found</h2>
            <p className="text-muted-foreground max-w-md">
              We couldn’t find anything matching "{query}"
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
