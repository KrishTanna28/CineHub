"use client"

import { useState, useEffect } from "react"
import RecommendationCarousel from "@/components/recommendation-carousel"
import { Loader2 } from "lucide-react"
import {
  getTrendingMovies,
  getMoviesByGenre,
  getCriticallyAcclaimed,
  getFeelGoodMovies,
} from "@/lib/movies"
import { RecommendationsSkeleton } from "@/components/skeletons"

// TMDB Genre IDs
const GENRE_IDS = {
  sciFi: 878,
  thriller: 53,
  drama: 18,
  action: 28,
}

function normalizeTMDBMovies(results = []) {
  return results.map((m) => ({
    id: m.id,
    title: m.title || m.name || "Unknown",
    description: m.overview || "",
    poster: m.poster_path
      ? `https://image.tmdb.org/t/p/w300${m.poster_path}`
      : null,
    rating: m.vote_average ? m.vote_average.toFixed(1) : "N/A",
    year: m.release_date
      ? m.release_date.split("-")[0]
      : m.first_air_date
      ? m.first_air_date.split("-")[0]
      : "N/A",
    genres: m.genre_ids || [],
  }))
}

export default function RecommendationsPage() {
  const [categories, setCategories] = useState({
    sciFi: [],
    thrillers: [],
    dramas: [],
    action: [],
    trending: [],
    acclaimed: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [sciFiData, thrillerData, dramaData, actionData, trendingData, acclaimedData] =
        await Promise.allSettled([
          getMoviesByGenre(GENRE_IDS.sciFi),
          getMoviesByGenre(GENRE_IDS.thriller),
          getMoviesByGenre(GENRE_IDS.drama),
          getMoviesByGenre(GENRE_IDS.action),
          getTrendingMovies("week"),
          getCriticallyAcclaimed(),
        ])

      setCategories({
        sciFi: sciFiData.status === "fulfilled" ? normalizeTMDBMovies(sciFiData.value?.results) : [],
        thrillers: thrillerData.status === "fulfilled" ? normalizeTMDBMovies(thrillerData.value?.results) : [],
        dramas: dramaData.status === "fulfilled" ? normalizeTMDBMovies(dramaData.value?.results) : [],
        action: actionData.status === "fulfilled" ? normalizeTMDBMovies(actionData.value?.results) : [],
        trending: trendingData.status === "fulfilled" ? normalizeTMDBMovies(trendingData.value?.results) : [],
        acclaimed: acclaimedData.status === "fulfilled" ? normalizeTMDBMovies(acclaimedData.value?.results) : [],
      })
    } catch (err) {
      console.error("Recommendations fetch error:", err)
      setError("Failed to load recommendations. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-transparent border-b border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Recommended For You</h1>
          <p className="text-muted-foreground text-lg">
            Personalized recommendations based on your viewing history and preferences
          </p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <RecommendationsSkeleton />
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive text-lg">{error}</p>
          </div>
        ) : (
          <>
            {categories.trending.length > 0 && (
              <RecommendationCarousel
                title="Trending This Week"
                movies={categories.trending}
                description="What everyone is watching right now"
              />
            )}

            {categories.sciFi.length > 0 && (
              <RecommendationCarousel
                title="Sci-Fi Adventures"
                movies={categories.sciFi}
                description="More great science fiction content"
              />
            )}

            {categories.thrillers.length > 0 && (
              <RecommendationCarousel
                title="Thrilling Mysteries"
                movies={categories.thrillers}
                description="Edge-of-your-seat thriller experiences"
              />
            )}

            {categories.dramas.length > 0 && (
              <RecommendationCarousel
                title="Award-Winning Dramas"
                movies={categories.dramas}
                description="Critically acclaimed dramatic films"
              />
            )}

            {categories.action.length > 0 && (
              <RecommendationCarousel
                title="Action-Packed Adventures"
                movies={categories.action}
                description="High-octane action and adventure"
              />
            )}

            {categories.acclaimed.length > 0 && (
              <RecommendationCarousel
                title="Critically Acclaimed"
                movies={categories.acclaimed}
                description="Top-rated films loved by critics and audiences"
              />
            )}
          </>
        )}
      </div>
    </main>
  )
}
