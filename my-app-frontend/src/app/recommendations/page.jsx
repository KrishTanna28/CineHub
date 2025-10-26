"use client"

import { mockMovies } from "@/lib/mock-data"
import RecommendationCarousel from "@/components/recommendation-carousel"

export default function RecommendationsPage() {
  // Simulate different recommendation categories
  const sciFiMovies = mockMovies.filter((m) => m.genres.includes("Sci-Fi"))
  const thrillers = mockMovies.filter((m) => m.genres.includes("Thriller"))
  const dramas = mockMovies.filter((m) => m.genres.includes("Drama"))
  const actionMovies = mockMovies.filter((m) => m.genres.includes("Action"))

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
        <RecommendationCarousel
          title="Because You Watched Sci-Fi"
          movies={sciFiMovies}
          description="More great science fiction content"
        />

        <RecommendationCarousel
          title="Thrilling Mysteries"
          movies={thrillers}
          description="Edge-of-your-seat thriller experiences"
        />

        <RecommendationCarousel
          title="Award-Winning Dramas"
          movies={dramas}
          description="Critically acclaimed dramatic films"
        />

        <RecommendationCarousel
          title="Action-Packed Adventures"
          movies={actionMovies}
          description="High-octane action and adventure"
        />
      </div>
    </main>
  )
}
