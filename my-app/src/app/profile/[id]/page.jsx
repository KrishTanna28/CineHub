"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  User,
  Star,
  Trophy,
  Calendar,
  Flame,
  Heart,
  Film,
  MessageSquare,
  Award,
  ArrowLeft,
  BookOpen
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PublicProfileSkeleton } from "@/components/skeletons"

// Level thresholds for display
const LEVEL_THRESHOLDS = [
  { level: 1, points: 0, title: 'Newcomer' },
  { level: 2, points: 100, title: 'Movie Buff' },
  { level: 3, points: 300, title: 'Cinephile' },
  { level: 4, points: 600, title: 'Film Critic' },
  { level: 5, points: 1000, title: 'Movie Expert' },
  { level: 6, points: 1500, title: 'Cinema Scholar' },
  { level: 7, points: 2100, title: 'Film Virtuoso' },
  { level: 8, points: 2800, title: 'Movie Legend' },
  { level: 9, points: 3600, title: 'Cinema Master' },
  { level: 10, points: 4500, title: 'Film God' },
]

function getLevelInfo(level) {
  return LEVEL_THRESHOLDS.find(l => l.level === level) || LEVEL_THRESHOLDS[0]
}

function getNextLevelThreshold(level) {
  const nextLevel = LEVEL_THRESHOLDS.find(l => l.level === level + 1)
  return nextLevel?.points || null
}

export default function PublicProfilePage({ params }) {
  const unwrappedParams = use(params)
  const userId = unwrappedParams.id
  const router = useRouter()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
    }
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()

      if (data.success) {
        setProfile(data.data)
      } else {
        setError(data.message || 'Failed to load profile')
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PublicProfileSkeleton />
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-background pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <User className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">User Not Found</h2>
            <p className="text-muted-foreground mb-4">{error || 'This user does not exist.'}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const levelInfo = getLevelInfo(profile.level)
  const nextLevelPoints = getNextLevelThreshold(profile.level)
  const progressToNextLevel = nextLevelPoints
    ? ((profile.points - getLevelInfo(profile.level).points) / (nextLevelPoints - getLevelInfo(profile.level).points)) * 100
    : 100

  return (
    <main className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Profile Header */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-28 h-28 md:w-36 md:h-36 ring-4 ring-primary/30">
                <AvatarImage src={profile.avatar} alt={profile.username} />
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                  {profile.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {/* Level Badge */}
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-bold shadow-lg">
                Lv. {profile.level}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                {profile.fullName || profile.username}
              </h1>
              <p className="text-muted-foreground mb-2">@{profile.username}</p>

              {/* Level Title */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full text-sm mb-4">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="font-medium">{levelInfo.title}</span>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-muted-foreground max-w-lg mb-4">{profile.bio}</p>
              )}

              {/* Member Since */}
              <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Member for {profile.memberDays} days</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Level Progress</span>
              <span className="font-medium">{profile.points} XP</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressToNextLevel, 100)}%` }}
              />
            </div>
            {nextLevelPoints && (
              <p className="text-xs text-muted-foreground mt-1">
                {nextLevelPoints - profile.points} XP to Level {profile.level + 1}
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <MessageSquare className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{profile.stats.totalReviews}</p>
            <p className="text-sm text-muted-foreground">Reviews</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{profile.stats.averageRating}</p>
            <p className="text-sm text-muted-foreground">Avg Rating</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{profile.stats.totalLikes}</p>
            <p className="text-sm text-muted-foreground">Likes Received</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{profile.streak?.current || 0}</p>
            <p className="text-sm text-muted-foreground">Day Streak</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-secondary/30 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{profile.watchlistCount}</p>
              <p className="text-sm text-muted-foreground">In Watchlist</p>
            </div>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{profile.favoritesCount}</p>
              <p className="text-sm text-muted-foreground">Favorites</p>
            </div>
          </div>
        </div>

        {/* Achievements */}
        {profile.achievements && profile.achievements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Achievements
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {profile.achievements.slice(0, 6).map((achievement, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-amber-500/30 rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{achievement.name || achievement}</p>
                    {achievement.unlockedAt && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {profile.achievements.length > 6 && (
              <p className="text-sm text-muted-foreground text-center mt-3">
                +{profile.achievements.length - 6} more achievements
              </p>
            )}
          </div>
        )}

        {/* Recent Reviews */}
        {profile.recentReviews && profile.recentReviews.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Recent Reviews
            </h2>
            <div className="space-y-4">
              {profile.recentReviews.map((review) => (
                <Link
                  key={review._id}
                  href={review.mediaType === 'tv' ? `/tv/${review.movieId}` : `/movies/${review.movieId}`}
                  className="block bg-secondary/30 rounded-xl p-4 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex gap-4">
                    {/* Poster */}
                    <div className="w-16 h-24 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                      {review.poster ? (
                        <img
                          src={review.poster}
                          alt={review.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                          {review.title}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{review.rating}/10</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {review.review}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Favorite Genres */}
        {profile.favoriteGenres && profile.favoriteGenres.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Favorite Genres</h2>
            <div className="flex flex-wrap gap-2">
              {profile.favoriteGenres.map((genre, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
