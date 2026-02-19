"use client"

import { useState, useEffect } from "react"
import { Trophy, Medal, Award, Loader2 } from "lucide-react"
import { LeaderboardSkeleton } from "@/components/skeletons"

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch("/api/users/leaderboard?limit=20")
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch leaderboard")
      }

      const users = (data.data?.users || []).map((user, index) => ({
        rank: index + 1,
        name: user.fullName || user.username || "Anonymous",
        username: user.username,
        points: user.points?.total || 0,
        badges: user.badges?.length || 0,
        avatar: user.avatar,
      }))

      setLeaderboard(users)
    } catch (err) {
      console.error("Leaderboard fetch error:", err)
      setError(err.message || "Failed to load leaderboard")
    } finally {
      setIsLoading(false)
    }
  }

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
        {isLoading ? (
          <LeaderboardSkeleton />
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive text-lg">{error}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No users on the leaderboard yet. Be the first!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Rank</th>
                  <th className="text-left py-4 px-4 text-muted-foreground font-semibold">User</th>
                  <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Points</th>
                  <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Badges</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.rank}
                    className="border-b border-border hover:bg-secondary/20 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {getMedalIcon(entry.rank)}
                        <span className="font-bold text-foreground text-lg">{entry.rank}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {entry.avatar ? (
                          <img
                            src={entry.avatar}
                            alt={entry.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-foreground block">{entry.name}</span>
                          {entry.username && (
                            <span className="text-xs text-muted-foreground">@{entry.username}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-primary text-lg">
                        {entry.points.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-semibold text-foreground">{entry.badges}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
