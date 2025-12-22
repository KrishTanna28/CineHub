"use client"

import { Trophy, Medal, Award } from "lucide-react"

export default function LeaderboardPage() {
  const leaderboard = [
    {
      rank: 1,
      name: "Alex Chen",
      points: 5420,
      badges: 12,
      moviesWatched: 234,
      reviewsWritten: 45,
    },
    {
      rank: 2,
      name: "Sarah Johnson",
      points: 4890,
      badges: 10,
      moviesWatched: 198,
      reviewsWritten: 38,
    },
    {
      rank: 3,
      name: "Marcus Williams",
      points: 4560,
      badges: 9,
      moviesWatched: 187,
      reviewsWritten: 32,
    },
    {
      rank: 4,
      name: "Emma Davis",
      points: 4120,
      badges: 8,
      moviesWatched: 165,
      reviewsWritten: 28,
    },
    {
      rank: 5,
      name: "James Wilson",
      points: 3890,
      badges: 7,
      moviesWatched: 152,
      reviewsWritten: 24,
    },
    {
      rank: 6,
      name: "Lisa Anderson",
      points: 3650,
      badges: 6,
      moviesWatched: 141,
      reviewsWritten: 20,
    },
    {
      rank: 7,
      name: "David Brown",
      points: 3420,
      badges: 5,
      moviesWatched: 128,
      reviewsWritten: 18,
    },
    {
      rank: 8,
      name: "Jessica Taylor",
      points: 3210,
      badges: 5,
      moviesWatched: 115,
      reviewsWritten: 15,
    },
  ]

  const getMedalIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-yellow-600" />
      default:
        return <Award className="w-6 h-6 text-primary" />
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-transparent border-b border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">Compete with other cinephiles and earn badges</p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Rank</th>
                <th className="text-left py-4 px-4 text-muted-foreground font-semibold">User</th>
                <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Points</th>
                <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Badges</th>
                <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Movies Watched</th>
                <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Reviews</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.rank} className="border-b border-border hover:bg-secondary/20 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {getMedalIcon(entry.rank)}
                      <span className="font-bold text-foreground text-lg">{entry.rank}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                        {entry.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-foreground">{entry.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-bold text-primary text-lg">{entry.points.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-semibold text-foreground">{entry.badges}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-semibold text-foreground">{entry.moviesWatched}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-semibold text-foreground">{entry.reviewsWritten}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
