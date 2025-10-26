"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import movieAPI from "@/lib/api/movies"
import useInfiniteScroll from "@/hooks/useInfiniteScroll"

const TYPES = ["All", "Movies", "Shows"]
const LANGUAGES = [
  { label: "All", value: "All" },
  { label: "English", value: "en" },
  { label: "Hindi", value: "hi" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Italian", value: "it" },
  { label: "Japanese", value: "ja" },
  { label: "Korean", value: "ko" },
  { label: "Chinese", value: "zh" },
  { label: "Portuguese", value: "pt" },
  { label: "Russian", value: "ru" },
  { label: "Arabic", value: "ar" },
  { label: "Turkish", value: "tr" },
]
const RATINGS = ["All", "9+ Excellent", "8+ Great", "7+ Good", "6+ Fair", "Below 6"]
const SORT_OPTIONS = [
  { label: "Default", value: "popularity.desc" },
  { label: "Rating (High to Low)", value: "vote_average.desc" },
  { label: "Rating (Low to High)", value: "vote_average.asc" },
  { label: "Title (A-Z)", value: "original_title.asc" },
  { label: "Title (Z-A)", value: "original_title.desc" },
  { label: "Year (Newest)", value: "primary_release_date.desc" },
  { label: "Year (Oldest)", value: "primary_release_date.asc" },
]

export default function BrowsePage() {
  const [genres, setGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState("All")
  const [selectedType, setSelectedType] = useState("All")
  const [selectedLanguage, setSelectedLanguage] = useState("All")
  const [selectedRating, setSelectedRating] = useState("All")
  const [sortBy, setSortBy] = useState("popularity.desc")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Infinite scroll
  const loadMoreRef = useInfiniteScroll(
    () => {
      if (page < totalPages && !isLoadingMore) {
        setPage(p => p + 1)
      }
    },
    page < totalPages,
    isLoadingMore,
    200
  )

  // Fetch genres on mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await movieAPI.getGenres()
        if (response.success) {
          setGenres(response.data)
        }
      } catch (err) {
        console.error('Failed to fetch genres:', err)
      }
    }
    fetchGenres()
  }, [])

  // Fetch movies/TV shows based on filters
  useEffect(() => {
    const fetchContent = async () => {
      // Only show main loading on first page
      if (page === 1) {
        setLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError(null)
      
      try {
        // Build filters
        const filters = {
          page,
          sortBy,
        }

        // Add genre filter
        if (selectedGenre !== "All") {
          const genre = genres.find(g => g.name === selectedGenre)
          if (genre) {
            filters.genres = genre.id
          }
        }

        // Add language filter
        if (selectedLanguage !== "All") {
          filters.language = selectedLanguage
        }

        // Add rating filter
        if (selectedRating !== "All") {
          if (selectedRating === "9+ Excellent") {
            filters.minRating = 9
          } else if (selectedRating === "8+ Great") {
            filters.minRating = 8
          } else if (selectedRating === "7+ Good") {
            filters.minRating = 7
          } else if (selectedRating === "6+ Fair") {
            filters.minRating = 6
          } else if (selectedRating === "Below 6") {
            filters.maxRating = 6
          }
        }

        // Fetch based on type
        let response
        if (selectedType === "Movies") {
          response = await movieAPI.discoverMovies(filters)
        } else if (selectedType === "Shows") {
          response = await movieAPI.discoverTV(filters)
        } else {
          // For "All", fetch movies by default
          response = await movieAPI.discoverMovies(filters)
        }

        if (response.success) {
          // Append results if loading more, otherwise replace
          if (page === 1) {
            const uniqueResults = Array.from(new Map(response.data.results.map(r => [`${r.mediaType}-${r.id}`, r])).values());
            setResults(uniqueResults)
          } else {
            const uniqueResults = Array.from(new Map([...results, ...response.data.results].map(r => [`${r.mediaType}-${r.id}`, r])).values());
            setResults(uniqueResults)
          }
          setTotalPages(response.data.totalPages)
          setTotalResults(response.data.totalResults)
        }
      } catch (err) {
        console.error('Failed to fetch content:', err)
        setError(err.message || 'Failed to load content')
        if (page === 1) {
          setResults([])
        }
      } finally {
        setLoading(false)
        setIsLoadingMore(false)
      }
    }

    if (genres.length > 0 || selectedGenre === "All") {
      fetchContent()
    }
  }, [selectedGenre, selectedType, selectedLanguage, selectedRating, sortBy, page, genres])

  const clearFilters = () => {
    setSelectedGenre("All")
    setSelectedType("All")
    setSelectedLanguage("All")
    setSelectedRating("All")
    setSortBy("popularity.desc")
    setPage(1)
  }

  const hasActiveFilters = selectedGenre !== "All" || selectedType !== "All" || selectedLanguage !== "All" || selectedRating !== "All" || sortBy !== "popularity.desc"

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      {/* <div className="bg-secondary/30 border-b border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Browse</h1>
          <p className="text-muted-foreground">Explore our collection with advanced filters</p>
        </div>
      </div> */}

      {/* Filters */}
      <div className="bg-background border-b border-border top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 position-">
          <h2 className="text-lg font-semibold text-foreground mb-4">Filters</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Type Dropdown */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Type</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:bg-secondary/70"
              >
                {TYPES.map((type) => (
                  <option key={type} value={type} className="bg-background text-foreground">{type}</option>
                ))}
              </select>
            </div>

            {/* Genre Dropdown */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => {
                  setSelectedGenre(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:bg-secondary/70"
              >
                <option value="All" className="bg-background text-foreground">All</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.name} className="bg-background text-foreground">{genre.name}</option>
                ))}
              </select>
            </div>

            {/* Language Dropdown */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:bg-secondary/70"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value} className="bg-background text-foreground">{lang.label}</option>
                ))}
              </select>
            </div>

            {/* Rating Dropdown */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Rating</label>
              <select
                value={selectedRating}
                onChange={(e) => {
                  setSelectedRating(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:bg-secondary/70"
              >
                {RATINGS.map((rating) => (
                  <option key={rating} value={rating} className="bg-background text-foreground">{rating}</option>
                ))}
              </select>
            </div>

            {/* Sort By Dropdown */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:bg-secondary/70"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-background text-foreground">{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">
            {loading ? "Loading..." : `${totalResults.toLocaleString()} Result${totalResults !== 1 ? "s" : ""}`}
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>

        {error ? (
          <div className="text-center py-16">
            <p className="text-destructive text-lg mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
            {[...Array(21)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-secondary/50 rounded-lg aspect-[2/3] w-full mb-3"></div>
                <div className="bg-secondary/50 rounded h-4 w-3/4 mb-2"></div>
                <div className="bg-secondary/50 rounded h-3 w-1/2"></div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
              {results.map((item) => {
                const detailsPath = item.mediaType === 'tv' ? `/tv/${item.id}` : `/details/${item.id}`
                return (
                  <Link key={`${item.mediaType}-${item.id}`} href={detailsPath} className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-lg mb-3 aspect-[2/3] bg-secondary">
                      {item.poster ? (
                        <img
                          src={item.poster}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl text-muted-foreground">🎬</span>
                        </div>
                      )}
                      
                      {/* Media Type Badge */}
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-bold uppercase">
                          {item.mediaType === 'tv' ? 'TV' : 'Movie'}
                        </span>
                      </div>

                      {/* Rating Badge */}
                      {item.rating > 0 && (
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
                      <p className="text-xs text-muted-foreground">
                        {item.releaseDate ? new Date(item.releaseDate).getFullYear() : 'N/A'}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Infinite Scroll Trigger & Loading Indicator */}
            {page < totalPages && (
              <div ref={loadMoreRef} className="flex justify-center mt-12 py-8">
                {isLoadingMore && (
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-muted-foreground text-sm">Loading more...</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">No results found</p>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
