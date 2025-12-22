"use client"

import { Star, Lock } from "lucide-react"

export default function AchievementsPage() {
  const achievements = [
    {
      id: "1",
      name: "Cinephile",
      description: "Watch 50 movies",
      icon: "🎬",
      unlocked: true,
    },
    {
      id: "2",
      name: "Critic",
      description: "Write 10 reviews",
      icon: "✍️",
      unlocked: true,
    },
    {
      id: "3",
      name: "Social Butterfly",
      description: "Join 5 watch rooms",
      icon: "🦋",
      unlocked: true,
    },
    {
      id: "4",
      name: "Genre Master",
      description: "Watch movies from all 8 genres",
      icon: "🎭",
      unlocked: false,
      progress: 6,
      maxProgress: 8,
    },
    {
      id: "5",
      name: "Night Owl",
      description: "Watch 10 movies between 10 PM and 6 AM",
      icon: "🌙",
      unlocked: false,
      progress: 7,
      maxProgress: 10,
    },
    {
      id: "7",
      name: "Marathon Runner",
      description: "Watch 5 movies in one day",
      icon: "🏃",
      unlocked: false,
      progress: 3,
      maxProgress: 5,
    },
    {
      id: "8",
      name: "Community Leader",
      description: "Get 100 likes on your reviews",
      icon: "👑",
      unlocked: false,
      progress: 67,
      maxProgress: 100,
    },
    {
      id: "9",
      name: "Collector",
      description: "Add 100 movies to your watchlist",
      icon: "📚",
      unlocked: false,
      progress: 45,
      maxProgress: 100,
    },
    {
      id: "10",
      name: "Legendary",
      description: "Reach 5000 points",
      icon: "⭐",
      unlocked: false,
      progress: 3420,
      maxProgress: 5000,
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-transparent border-b border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Achievements</h1>
          </div>
          <p className="text-muted-foreground text-lg">Unlock badges and earn rewards</p>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`rounded-lg p-6 border transition-all ${
                achievement.unlocked
                  ? "bg-primary/10 border-primary/50 hover:border-primary"
                  : "bg-secondary/20 border-border hover:border-border/80"
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-3 relative">
                  {achievement.icon}
                  {!achievement.unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-foreground mb-1">{achievement.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{achievement.description}</p>

                {achievement.progress !== undefined && achievement.maxProgress !== undefined && (
                  <div>
                    <div className="w-full bg-secondary rounded-full h-2 mb-1">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {achievement.progress}/{achievement.maxProgress}
                    </p>
                  </div>
                )}

                {achievement.unlocked && (
                  <div className="mt-3 inline-block px-2 py-1 bg-primary/20 text-primary text-xs font-semibold rounded">
                    Unlocked
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Your Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-secondary/30 rounded-lg p-6 border border-border">
            <p className="text-muted-foreground text-sm mb-2">Achievements Unlocked</p>
            <p className="text-3xl font-bold text-primary">3/9</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-6 border border-border">
            <p className="text-muted-foreground text-sm mb-2">Total Points</p>
            <p className="text-3xl font-bold text-primary">2,450</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-6 border border-border">
            <p className="text-muted-foreground text-sm mb-2">Current Rank</p>
            <p className="text-3xl font-bold text-primary">Gold</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-6 border border-border">
            <p className="text-muted-foreground text-sm mb-2">Next Rank In</p>
            <p className="text-3xl font-bold text-primary">2,550 pts</p>
          </div>
        </div>
      </div>
    </main>
  )
}
