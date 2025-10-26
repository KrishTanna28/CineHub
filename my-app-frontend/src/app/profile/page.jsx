"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Settings, LogOut, Trophy, Star, Users, Film, Heart, Award, Flame, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/contexts/UserContext"
import movieAPI from "@/lib/api/movies"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [watchlist, setWatchlist] = useState([])
  const [favorites, setFavorites] = useState([])
  const [reviews, setReviews] = useState([])
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const router = useRouter()
  const { user, isLoading, logout } = useUser()

  useEffect(() => {
    // Check authentication
    if (!isLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      const token = localStorage.getItem('token')
      if (token) {
        fetchUserStats(token)
      }
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (activeTab === 'watchlist' && watchlist.length === 0) {
      fetchWatchlist()
    } else if (activeTab === 'favorites' && favorites.length === 0) {
      fetchFavorites()
    } else if (activeTab === 'reviews' && reviews.length === 0) {
      fetchReviews()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const fetchUserStats = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/users/me/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setStats(data.data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchWatchlist = async () => {
    setWatchlistLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/users/me/watchlist', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      console.log('Watchlist data:', data)

      if (data.success && data.data.watchlist.length > 0) {
        // Fetch movie details from TMDB
        const movieDetails = await Promise.all(
          data.data.watchlist.map(async (item) => {
            try {
              console.log('Fetching movie:', item.movieId)
              const response = await movieAPI.getMovieDetails(item.movieId)
              console.log('Movie response:', response)

              // Extract the actual movie data
              const movieData = response.success ? response.data : response

              return {
                ...movieData,
                addedAt: item.addedAt
              }
            } catch (error) {
              console.error('Error fetching movie:', item.movieId, error)
              return null
            }
          })
        )

        const validMovies = movieDetails.filter(m => m !== null)
        console.log('Valid movies:', validMovies)
        setWatchlist(validMovies)
      } else {
        setWatchlist([])
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error)
    } finally {
      setWatchlistLoading(false)
    }
  }

  const fetchFavorites = async () => {
    setFavoritesLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/users/me/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      console.log('Favorites data:', data)

      if (data.success && data.data.favorites.length > 0) {
        // Fetch movie details from TMDB
        const movieDetails = await Promise.all(
          data.data.favorites.map(async (item) => {
            try {
              const response = await movieAPI.getMovieDetails(item.movieId)

              // Extract the actual movie data
              const movieData = response.success ? response.data : response

              return {
                ...movieData,
                addedAt: item.addedAt
              }
            } catch (error) {
              console.error('Error fetching movie:', item.movieId, error)
              return null
            }
          })
        )

        const validMovies = movieDetails.filter(m => m !== null)
        setFavorites(validMovies)
      } else {
        setFavorites([])
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setFavoritesLoading(false)
    }
  }

  const fetchReviews = async () => {
    setReviewsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/reviews/user/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setReviews(data.data.reviews)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setReviewsLoading(false)
    }
  }

  const removeFromWatchlist = async (movieId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/users/me/watchlist/${movieId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setWatchlist(watchlist.filter(m => m.id.toString() !== movieId))
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error)
    }
  }

  const removeFromFavorites = async (movieId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/users/me/favorites/${movieId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setFavorites(favorites.filter(m => m.id.toString() !== movieId))
      }
    } catch (error) {
      console.error('Error removing from favorites:', error)
    }
  }

  const handleLogout = () => {
    logout()
  }

  if (isLoading || statsLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-transparent border-b border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-primary">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">{user.fullName || user.username}</h1>
                <p className="text-lg text-primary font-semibold mb-2">@{user.username}</p>
                <p className="text-muted-foreground">Level {stats?.level || 1} • {stats?.points?.total || 0} Points</p>
                {user.bio && <p className="text-muted-foreground mt-2 max-w-2xl">{user.bio}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-secondary/30 rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground text-sm">Points</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.points?.total?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground text-sm">Level</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.level || 1}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground text-sm">Badges</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.badges || 0}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Film className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground text-sm">Watchlist</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.watchlistCount || 0}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground text-sm">Favorites</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.favoritesCount || 0}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground text-sm">Streak</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.streaks?.current || 0}</p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Achievements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="bg-secondary/30 rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Reviews Written</span>
              <Star className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.achievements?.reviewsWritten || 0}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Ratings Given</span>
              <Star className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.achievements?.ratingsGiven || 0}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Watch Parties</span>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.achievements?.watchPartiesJoined || 0}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Friends Referred</span>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.achievements?.friendsReferred || 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8 border-b border-border">
          {["overview", "watchlist", "favorites", "reviews"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold transition-colors border-b-2 cursor-pointer ${activeTab === tab
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">Account Information</h3>
            <div className="bg-secondary/20 rounded-lg p-6 border border-border space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-foreground font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="text-foreground font-medium">@{user.username}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Referral Code</p>
                <p className="text-foreground font-medium">{stats?.referralCode || user.referralCode || 'N/A'}</p>
              </div>
              {user.preferences?.favoriteGenres && user.preferences.favoriteGenres.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Favorite Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {user.preferences.favoriteGenres.map((genre) => (
                      <span key={genre} className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "watchlist" && (
          <div>
            <h3 className="text-xl font-bold text-foreground mb-6">Your Watchlist ({watchlist.length})</h3>
            {watchlistLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : watchlist.length === 0 ? (
              <div className="text-center py-12">
                <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Your watchlist is empty</p>
                <Link href="/browse">
                  <Button>Browse Movies</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {watchlist.map((movie, index) => {
                  const title = movie.title || movie.name
                  const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv')
                  const detailsUrl = mediaType === 'tv' ? `/tv/${movie.id}` : `/details/${movie.id}`

                  return (
                    <div key={`watchlist-${movie.id}-${index}`} className="group relative">
                      <Link href={detailsUrl}>
                        <div className="poster-card cursor-pointer">
                          <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster}`}
                            alt={title}
                            className="w-full h-auto rounded-lg"
                          />
                          <div className="poster-overlay">
                            <div className="w-full">
                              <h3 className="font-bold text-white mb-2 line-clamp-2">{title}</h3>
                              <span className="rating-badge">⭐ {movie.rating?.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                      <button
                        onClick={() => removeFromWatchlist(movie.id.toString())}
                        className="absolute top-2 right-2 hover:text-primary text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "favorites" && (
          <div>
            <h3 className="text-xl font-bold text-foreground mb-6">Your Favorites ({favorites.length})</h3>
            {favoritesLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">You haven't added any favorites yet</p>
                <Link href="/browse">
                  <Button>Browse Movies</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {favorites.map((movie, index) => {
                  const title = movie.title || movie.name
                  const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv')
                  const detailsUrl = mediaType === 'tv' ? `/tv/${movie.id}` : `/details/${movie.id}`

                  return (
                    <div key={`watchlist-${movie.id}-${index}`} className="group relative">
                      <Link href={detailsUrl}>
                        <div className="poster-card cursor-pointer">
                          <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster}`}
                            alt={title}
                            className="w-full h-auto rounded-lg"
                          />
                          <div className="poster-overlay">
                            <div className="w-full">
                              <h3 className="font-bold text-white mb-2 line-clamp-2">{title}</h3>
                              <span className="rating-badge">⭐ {movie.rating?.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                      <button
                        onClick={() => removeFromFavorites(movie.id.toString())}
                        className="absolute top-2 right-2 hover:text-primary text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div>
            <h3 className="text-xl font-bold text-foreground mb-6">Your Reviews ({reviews.length})</h3>
            {reviewsLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">You haven't written any reviews yet</p>
                <Link href="/browse">
                  <Button>Browse Movies</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <Link key={review._id || `review-${index}`} href={`/reviews/${review.mediaType}/${review.mediaId}`}>
                    <div className="bg-secondary/20 rounded-lg p-6 border border-border hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-foreground text-lg">{review.title || 'Review'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className="rating-badge">⭐ {review.rating}/10</span>
                      </div>
                      <p className="text-foreground line-clamp-3">{review.content}</p>
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <span>👍 {review.likeCount || 0} likes</span>
                        <span>💬 {review.replyCount || 0} replies</span>
                        {review.hasSpoilers && <span className="text-red-500">⚠️ Contains spoilers</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
