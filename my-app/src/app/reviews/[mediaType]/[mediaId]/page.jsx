"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ThumbsUp, ThumbsDown, MessageCircle, AlertTriangle, ArrowLeft, Star, Send, Plus, Edit2, Trash2, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import useInfiniteScroll from "@/hooks/useInfiniteScroll"
import { useUser } from "@/contexts/UserContext"
import reviewAPI from "@/lib/api/reviews"

export default function ReviewsPage({ params }) {
  const unwrappedParams = use(params)
  const router = useRouter()
  const { user } = useUser()

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [sortBy, setSortBy] = useState('recent')

  // Write review state
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    content: '',
    spoiler: false
  })
  const [hoverRating, setHoverRating] = useState(0)
  const [editingReview, setEditingReview] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Reply state
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [showReplies, setShowReplies] = useState(new Set())
  const [mentionUser, setMentionUser] = useState(null)
  const [revealedSpoilers, setRevealedSpoilers] = useState(new Set())
  
  // Delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState(null) // { type: 'review' | 'reply', id: string, reviewId?: string }

  // Fetch reviews
  const fetchReviews = async (pageNum = 1, sort = sortBy) => {
    if (pageNum === 1) {
      setLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const data = await reviewAPI.getReviews(
        unwrappedParams.mediaType,
        unwrappedParams.mediaId,
        pageNum,
        10,
        sort
      )

      if (data.success) {
        if (pageNum === 1) {
          setReviews(data.data)
        } else {
          setReviews(prev => [...prev, ...data.data])
        }
        setHasMore(data.pagination.page < data.pagination.pages)
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
      setError('Failed to load reviews')
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchReviews(1, sortBy)
  }, [unwrappedParams.mediaId, sortBy])

  // Load more reviews
  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchReviews(nextPage, sortBy)
    }
  }

  // Infinite scroll
  const loadMoreRef = useInfiniteScroll(loadMore, hasMore, isLoadingMore, 300)

  // Submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!user) {
      router.push('/login')
      return
    }

    try {
      if (editingReview) {
        // Optimistic update for editing
        const optimisticReview = {
          ...editingReview,
          ...reviewForm,
          updatedAt: new Date().toISOString()
        }
        setReviews(prev => prev.map(r => r._id === editingReview._id ? optimisticReview : r))
        setSuccess('Review updated successfully!')
        setShowWriteReview(false)
        setEditingReview(null)
        setReviewForm({ rating: 5, title: '', content: '', spoiler: false })

        // Update existing review
        const data = await reviewAPI.updateReview(
          editingReview._id,
          reviewForm
        )

        if (data.success) {
          setReviews(prev => prev.map(r => r._id === editingReview._id ? data.data : r))
        }
      } else {
        // Optimistic update for new review
        const tempReview = {
          _id: 'temp-' + Date.now(),
          user: {
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
            fullName: user.fullName
          },
          ...reviewForm,
          mediaId: unwrappedParams.mediaId,
          mediaType: unwrappedParams.mediaType,
          likes: [],
          dislikes: [],
          likeCount: 0,
          dislikeCount: 0,
          replies: [],
          replyCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setReviews(prev => [tempReview, ...prev])
        setSuccess('Review posted successfully!')
        setShowWriteReview(false)
        const formData = { ...reviewForm }
        setReviewForm({ rating: 5, title: '', content: '', spoiler: false })

        // Create new review
        const data = await reviewAPI.createReview(
          {
            ...formData,
            mediaId: unwrappedParams.mediaId,
            mediaType: unwrappedParams.mediaType,
            mediaTitle: 'Movie Title' // You'll need to pass this from the detail page
          }
        )

        if (data.success) {
          // Replace temp review with real one
          setReviews(prev => prev.map(r => r._id === tempReview._id ? data.data : r))
        }
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
      setError(error.message || 'Failed to submit review')
      // Revert optimistic update on error
      if (editingReview) {
        setReviews(prev => prev.map(r => r._id === editingReview._id ? editingReview : r))
      } else {
        setReviews(prev => prev.filter(r => !r._id.startsWith('temp-')))
      }
    }
  }

  // Like review
  const handleLikeReview = async (reviewId) => {
    if (!user) {
      router.push('/login')
      return
    }

    // Optimistic update
    setReviews(prev => prev.map(r => {
      if (r._id === reviewId) {
        const userLiked = r.likes?.some(id => id.toString() === user._id)
        const userDisliked = r.dislikes?.some(id => id.toString() === user._id)
        
        return {
          ...r,
          likeCount: userLiked ? (r.likeCount || 1) - 1 : (r.likeCount || 0) + 1,
          dislikeCount: userDisliked ? (r.dislikeCount || 1) - 1 : r.dislikeCount || 0,
          likes: userLiked ? (r.likes || []).filter(id => id.toString() !== user._id) : [...(r.likes || []), user._id],
          dislikes: userDisliked ? (r.dislikes || []).filter(id => id.toString() !== user._id) : r.dislikes || []
        }
      }
      return r
    }))

    try {
      const data = await reviewAPI.likeReview(reviewId)

      if (data.success) {
        // Update with actual data from server
        setReviews(prev => prev.map(r => {
          if (r._id === reviewId) {
            return {
              ...r,
              likeCount: data.data.likes,
              dislikeCount: data.data.dislikes,
              likes: data.data.userLiked ? [...(r.likes || []), user._id] : (r.likes || []).filter(id => id.toString() !== user._id),
              dislikes: data.data.userDisliked ? [...(r.dislikes || []), user._id] : (r.dislikes || []).filter(id => id.toString() !== user._id)
            }
          }
          return r
        }))
      }
    } catch (error) {
      console.error('Failed to like review:', error)
      setError('Failed to like review')
      // Revert optimistic update on error
      setReviews(prev => prev.map(r => {
        if (r._id === reviewId) {
          const userLiked = r.likes?.some(id => id.toString() === user._id)
          const userDisliked = r.dislikes?.some(id => id.toString() === user._id)
          return {
            ...r,
            likeCount: userLiked ? (r.likeCount || 0) - 1 : (r.likeCount || 1) + 1,
            dislikeCount: userDisliked ? (r.dislikeCount || 0) + 1 : r.dislikeCount || 0,
            likes: userLiked ? (r.likes || []).filter(id => id.toString() !== user._id) : [...(r.likes || []), user._id],
            dislikes: userDisliked ? [...(r.dislikes || []), user._id] : (r.dislikes || []).filter(id => id.toString() !== user._id)
          }
        }
        return r
      }))
    }
  }

  // Dislike review
  const handleDislikeReview = async (reviewId) => {
    if (!user) {
      router.push('/login')
      return
    }

    // Optimistic update
    setReviews(prev => prev.map(r => {
      if (r._id === reviewId) {
        const userLiked = r.likes?.some(id => id.toString() === user._id)
        const userDisliked = r.dislikes?.some(id => id.toString() === user._id)
        
        return {
          ...r,
          likeCount: userLiked ? (r.likeCount || 1) - 1 : r.likeCount || 0,
          dislikeCount: userDisliked ? (r.dislikeCount || 1) - 1 : (r.dislikeCount || 0) + 1,
          likes: userLiked ? (r.likes || []).filter(id => id.toString() !== user._id) : r.likes || [],
          dislikes: userDisliked ? (r.dislikes || []).filter(id => id.toString() !== user._id) : [...(r.dislikes || []), user._id]
        }
      }
      return r
    }))

    try {
      const data = await reviewAPI.dislikeReview(reviewId)

      if (data.success) {
        // Update with actual data from server
        setReviews(prev => prev.map(r => {
          if (r._id === reviewId) {
            return {
              ...r,
              likeCount: data.data.likes,
              dislikeCount: data.data.dislikes,
              likes: data.data.userLiked ? [...(r.likes || []), user._id] : (r.likes || []).filter(id => id.toString() !== user._id),
              dislikes: data.data.userDisliked ? [...(r.dislikes || []), user._id] : (r.dislikes || []).filter(id => id.toString() !== user._id)
            }
          }
          return r
        }))
      }
    } catch (error) {
      console.error('Failed to dislike review:', error)
      setError('Failed to dislike review')
      // Revert optimistic update on error
      setReviews(prev => prev.map(r => {
        if (r._id === reviewId) {
          const userLiked = r.likes?.some(id => id.toString() === user._id)
          const userDisliked = r.dislikes?.some(id => id.toString() === user._id)
          return {
            ...r,
            likeCount: userLiked ? (r.likeCount || 0) + 1 : r.likeCount || 0,
            dislikeCount: userDisliked ? (r.dislikeCount || 0) - 1 : (r.dislikeCount || 1) + 1,
            likes: userLiked ? [...(r.likes || []), user._id] : (r.likes || []).filter(id => id.toString() !== user._id),
            dislikes: userDisliked ? (r.dislikes || []).filter(id => id.toString() !== user._id) : [...(r.dislikes || []), user._id]
          }
        }
        return r
      }))
    }
  }

  // Submit reply
  const handleSubmitReply = async (reviewId) => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!replyContent.trim()) return

    const tempReply = {
      _id: 'temp-' + Date.now(),
      user: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        fullName: user.fullName
      },
      content: replyContent,
      likes: [],
      dislikes: [],
      createdAt: new Date().toISOString()
    }

    // Optimistic update - add reply immediately
    setReviews(prev => prev.map(r => {
      if (r._id === reviewId) {
        return {
          ...r,
          replies: [...(r.replies || []), tempReply],
          replyCount: (r.replyCount || 0) + 1
        }
      }
      return r
    }))

    // Clear form and show replies
    const contentToSend = replyContent
    setReplyingTo(null)
    setReplyContent('')
    setMentionUser(null)
    const newShowReplies = new Set(showReplies)
    newShowReplies.add(reviewId)
    setShowReplies(newShowReplies)

    try {
      const data = await reviewAPI.addReply(reviewId, contentToSend)

      if (data.success) {
        // Replace temp reply with actual data from server
        setReviews(prev => prev.map(r => r._id === reviewId ? data.data : r))
        setShowReplies(newShowReplies)
      }
    } catch (error) {
      console.error('Failed to submit reply:', error)
      setError('Failed to submit reply')
    }
  }

  // Like a reply
  const handleLikeReply = async (reviewId, replyId) => {
    if (!user) {
      router.push('/login')
      return
    }

    // Optimistic update
    setReviews(prev => prev.map(r => {
      if (r._id === reviewId) {
        return {
          ...r,
          replies: r.replies.map(reply => {
            if (reply._id === replyId) {
              const userLiked = reply.likes?.some(id => id.toString() === user._id)
              const userDisliked = reply.dislikes?.some(id => id.toString() === user._id)
              return {
                ...reply,
                likes: userLiked ? (reply.likes || []).filter(id => id.toString() !== user._id) : [...(reply.likes || []), user._id],
                dislikes: userDisliked ? (reply.dislikes || []).filter(id => id.toString() !== user._id) : reply.dislikes || []
              }
            }
            return reply
          })
        }
      }
      return r
    }))

    try {
      const data = await reviewAPI.likeReply(reviewId, replyId)

      if (data.success) {
        setReviews(prev => prev.map(r => {
          if (r._id === reviewId) {
            return {
              ...r,
              replies: r.replies.map(reply => {
                if (reply._id === replyId) {
                  return {
                    ...reply,
                    likes: data.data.userLiked ? [...(reply.likes || []), user._id] : (reply.likes || []).filter(id => id.toString() !== user._id),
                    dislikes: data.data.userDisliked ? [...(reply.dislikes || []), user._id] : (reply.dislikes || []).filter(id => id.toString() !== user._id)
                  }
                }
                return reply
              })
            }
          }
          return r
        }))
      }
    } catch (error) {
      console.error('Failed to like reply:', error)
      setError('Failed to like reply')
      // Revert on error
      setReviews(prev => prev.map(r => {
        if (r._id === reviewId) {
          return {
            ...r,
            replies: r.replies.map(reply => {
              if (reply._id === replyId) {
                const userLiked = reply.likes?.some(id => id.toString() === user._id)
                const userDisliked = reply.dislikes?.some(id => id.toString() === user._id)
                return {
                  ...reply,
                  likes: userLiked ? (reply.likes || []).filter(id => id.toString() !== user._id) : [...(reply.likes || []), user._id],
                  dislikes: userDisliked ? [...(reply.dislikes || []), user._id] : (reply.dislikes || []).filter(id => id.toString() !== user._id)
                }
              }
              return reply
            })
          }
        }
        return r
      }))
    }
  }

  // Dislike a reply
  const handleDislikeReply = async (reviewId, replyId) => {
    if (!user) {
      router.push('/login')
      return
    }

    // Optimistic update
    setReviews(prev => prev.map(r => {
      if (r._id === reviewId) {
        return {
          ...r,
          replies: r.replies.map(reply => {
            if (reply._id === replyId) {
              const userLiked = reply.likes?.some(id => id.toString() === user._id)
              const userDisliked = reply.dislikes?.some(id => id.toString() === user._id)
              return {
                ...reply,
                likes: userLiked ? (reply.likes || []).filter(id => id.toString() !== user._id) : reply.likes || [],
                dislikes: userDisliked ? (reply.dislikes || []).filter(id => id.toString() !== user._id) : [...(reply.dislikes || []), user._id]
              }
            }
            return reply
          })
        }
      }
      return r
    }))

    try {
      const data = await reviewAPI.dislikeReply(reviewId, replyId)

      if (data.success) {
        setReviews(prev => prev.map(r => {
          if (r._id === reviewId) {
            return {
              ...r,
              replies: r.replies.map(reply => {
                if (reply._id === replyId) {
                  return {
                    ...reply,
                    likes: data.data.userLiked ? [...(reply.likes || []), user._id] : (reply.likes || []).filter(id => id.toString() !== user._id),
                    dislikes: data.data.userDisliked ? [...(reply.dislikes || []), user._id] : (reply.dislikes || []).filter(id => id.toString() !== user._id)
                  }
                }
                return reply
              })
            }
          }
          return r
        }))
      }
    } catch (error) {
      console.error('Failed to dislike reply:', error)
      setError('Failed to dislike reply')
      // Revert on error
      setReviews(prev => prev.map(r => {
        if (r._id === reviewId) {
          return {
            ...r,
            replies: r.replies.map(reply => {
              if (reply._id === replyId) {
                const userLiked = reply.likes?.some(id => id.toString() === user._id)
                const userDisliked = reply.dislikes?.some(id => id.toString() === user._id)
                return {
                  ...reply,
                  likes: userLiked ? [...(reply.likes || []), user._id] : (reply.likes || []).filter(id => id.toString() !== user._id),
                  dislikes: userDisliked ? (reply.dislikes || []).filter(id => id.toString() !== user._id) : [...(reply.dislikes || []), user._id]
                }
              }
              return reply
            })
          }
        }
        return r
      }))
    }
  }

  // Edit review
  const handleEditReview = (review) => {
    setEditingReview(review)
    setReviewForm({
      rating: review.rating,
      title: review.title,
      content: review.content,
      spoiler: review.spoiler
    })
    setShowWriteReview(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    if (!user) {
      router.push('/login')
      return
    }

    setDeleteConfirmation({ type: 'review', id: reviewId })
  }

  const confirmDelete = async () => {
    if (!deleteConfirmation) return

    const deletedItem = deleteConfirmation
    let backupData = null

    try {
      if (deleteConfirmation.type === 'review') {
        // Backup and optimistically remove review
        backupData = reviews.find(r => r._id === deletedItem.id)
        setReviews(prev => prev.filter(r => r._id !== deletedItem.id))
        setSuccess('Review deleted successfully!')
        setTimeout(() => setSuccess(null), 3000)
        setDeleteConfirmation(null)

        const data = await reviewAPI.deleteReview(deletedItem.id)

        if (!data.success) {
          throw new Error('Delete failed')
        }
      } else if (deleteConfirmation.type === 'reply') {
        // Backup and optimistically remove reply
        const review = reviews.find(r => r._id === deletedItem.reviewId)
        if (review) {
          backupData = { review, reply: review.replies.find(rep => rep._id === deletedItem.id) }
          setReviews(prev => prev.map(r => {
            if (r._id === deletedItem.reviewId) {
              return {
                ...r,
                replies: r.replies.filter(rep => rep._id !== deletedItem.id),
                replyCount: Math.max(0, (r.replyCount || 0) - 1)
              }
            }
            return r
          }))
          setSuccess('Reply deleted successfully!')
          setTimeout(() => setSuccess(null), 3000)
          setDeleteConfirmation(null)

          // TODO: Call delete reply API when available
          // const data = await reviewAPI.deleteReply(deletedItem.reviewId, deletedItem.id)
          console.log('Delete reply:', deletedItem.id)
        }
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      setError('Failed to delete')
      setTimeout(() => setError(null), 3000)
      
      // Revert optimistic update on error
      if (deletedItem.type === 'review' && backupData) {
        setReviews(prev => [backupData, ...prev])
      } else if (deletedItem.type === 'reply' && backupData) {
        setReviews(prev => prev.map(r => {
          if (r._id === deletedItem.reviewId) {
            return {
              ...r,
              replies: [...r.replies, backupData.reply],
              replyCount: (r.replyCount || 0) + 1
            }
          }
          return r
        }))
      }
    }
  }

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingReview(null)
    setReviewForm({ rating: 5, title: '', content: '', spoiler: false })
    setShowWriteReview(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm gap-2 hover:text-primary mb-5"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">User Reviews</h1>
            {!showWriteReview && (
              <button
                onClick={() => setShowWriteReview(!showWriteReview)}
                className="flex items-center text-sm gap-2 hover:text-primary mb-5"
              >
                <Plus className="w-5 h-5" />
                Write a Review
              </button>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {/* {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-500 rounded-lg p-4 mb-6">
            {success}
          </div>
        )} */}
        {error && (
          <div className="bg-destructive/20 border border-destructive text-destructive rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* Write Review Form */}
        {showWriteReview && (
          <div className="bg-card rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {editingReview ? 'Edit Your Review' : 'Write Your Review'}
            </h2>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rating: {hoverRating || reviewForm.rating}/10
                </label>
                <div
                  className="flex items-center gap-2"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[...Array(10)].map((_, i) => {
                    const starValue = i + 1
                    const isFilled = hoverRating ? i < hoverRating : i < reviewForm.rating

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReviewForm(prev => ({ ...prev, rating: starValue }))}
                        onMouseEnter={() => setHoverRating(starValue)}
                        className="transition-all hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 cursor-pointer transition-colors ${isFilled
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground hover:text-primary/50'
                            }`}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Input
                  style={{
                    borderColor: 'var(--border)',
                  }}
                  placeholder="Review Title"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  maxLength={200}
                />
              </div>

              <div>
                <Textarea
                  style={{
                    borderColor: 'var(--border)',
                  }}
                  placeholder="Write your review here..."
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                  required
                  rows={6}
                  minLength={10}
                  maxLength={5000}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="spoiler"
                  checked={reviewForm.spoiler}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, spoiler: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="spoiler" className="text-sm text-foreground cursor-pointer">
                  Contains Spoilers
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingReview ? 'Update Review' : 'Submit Review'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Sort Options */}
      {reviews.length > 0 && <div className="flex gap-2 mb-6">
        <Button
          variant={sortBy === 'recent' ? 'default' : 'outline'}
          onClick={() => { setSortBy('recent'); setPage(1); }}
          size="sm"
        >
          Recent
        </Button>
        <Button
          variant={sortBy === 'popular' ? 'default' : 'outline'}
          onClick={() => { setSortBy('popular'); setPage(1); }}
          size="sm"
        >
          Popular
        </Button>
        <Button
          variant={sortBy === 'rating' ? 'default' : 'outline'}
          onClick={() => { setSortBy('rating'); setPage(1); }}
          size="sm"
        >
          Highest Rated
        </Button>
      </div>}

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.map((review) => {
            const isSpoilerRevealed = revealedSpoilers.has(review._id)
            const isOwnReview = user && review.user?._id === user.id
            
            return (
            <div key={review._id} className="bg-card rounded-lg p-6">
              {/* Review Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  {review.user?.avatar ? (
                    <img src={review.user.avatar} alt={review.user.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-foreground">
                      {review.user?.username?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{review.user?.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                    {review.spoiler && (
                      <span className="px-2 py-0.5 bg-destructive/20 text-destructive rounded text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Spoiler
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(10)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                          }`}
                      />
                    ))}
                    <span className="ml-2 text-sm font-semibold text-foreground">
                      {review.rating}/10
                    </span>
                  </div>

                  {/* Review Content with Spoiler Blur */}
                  <div className="relative">
                    <h3 className={`text-lg font-bold text-foreground mb-2 transition-all ${
                      review.spoiler && !isSpoilerRevealed && review.user._id !== user.id? 'blur-md select-none' : ''
                    }`}>{review.title}</h3>
                    <p className={`text-foreground whitespace-pre-wrap transition-all ${
                      review.spoiler && !isSpoilerRevealed && review.user._id !== user.id? 'blur-md select-none' : ''
                    }`}>{review.content}</p>
                    
                    {/* Spoiler Reveal Button */}
                    {review.spoiler && !isSpoilerRevealed && review.user._id !== user.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={() => {
                            const newRevealed = new Set(revealedSpoilers)
                            newRevealed.add(review._id)
                            setRevealedSpoilers(newRevealed)
                          }}
                          className="px-4 py-2 bg-destructive/90 hover:bg-destructive text-white rounded-lg font-semibold transition-colors shadow-lg"
                        >
                          Click to Reveal Spoiler
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit/Delete Buttons (only for own reviews) */}
                {isOwnReview && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEditReview(review)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Edit review"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Delete review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Review Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                    <button
                      onClick={() => handleLikeReview(review._id)}
                      className={`flex items-center gap-2 text-sm transition-colors ${review.likes?.some(id => id.toString() === user?._id)
                          ? "text-primary font-bold"
                          : "text-muted-foreground hover:text-primary"
                        }`}
                    >
                      <ThumbsUp
                        className={`w-4 h-4 ${review.likes?.some(id => id.toString() === user?._id) ? "fill-primary text-primary" : ""
                          }`}
                      />
                      <span>{review.likeCount || 0}</span>
                    </button>
                    <button
                      onClick={() => handleDislikeReview(review._id)}
                      className={`flex items-center gap-2 text-sm transition-colors ${review.dislikes?.some(id => id.toString() === user?._id)
                          ? "text-destructive"
                          : "text-muted-foreground hover:text-destructive"
                        }`}
                    >
                      <ThumbsDown
                        className={`w-4 h-4 ${review.dislikes?.some(id => id.toString() === user?._id) ? "fill-destructive text-destructive" : ""
                          }`}
                      />
                      <span>{review.dislikeCount || 0}</span>
                    </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newShowReplies = new Set(showReplies)
                      if (newShowReplies.has(review._id)) {
                        newShowReplies.delete(review._id)
                      } else {
                        newShowReplies.add(review._id)
                      }
                      setShowReplies(newShowReplies)
                    }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{review.replyCount == 1 ? review.replyCount + ' Reply' : review.replyCount + ' Replies'}</span>
                  </button>
                  
                  {user && (
                    <button
                      onClick={() => setReplyingTo(replyingTo === review._id ? null : review._id)}
                      className="w-5 h-5 rounded-full border border-muted-foreground flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      title={replyingTo === review._id ? 'Cancel Reply' : 'Write Reply'}
                    >
                      {replyingTo === review._id ? (
                        <Minus className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              {replyingTo === review._id && (
                <div className="mt-4 pl-16">
                  {mentionUser && (
                    <div className="mb-2 text-xs text-muted-foreground">
                      Replying to <span className="text-primary font-semibold">@{mentionUser}</span>
                      <button
                        onClick={() => {
                          setMentionUser(null)
                          setReplyContent('')
                        }}
                        className="ml-2 text-destructive hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={mentionUser ? `Reply to @${mentionUser}...` : "Write a reply..."}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={3}
                      className="flex-1"
                      style={{
                        borderColor: 'var(--border)',
                      }}
                    />
                    <Button
                      onClick={() => handleSubmitReply(review._id)}
                      size="sm"
                      disabled={!replyContent.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {review.replies && review.replies.length > 0 && showReplies.has(review._id) && (
                <div className="mt-4 pl-16 space-y-4">
                  {review.replies.map((reply) => (
                    <div key={reply._id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        {reply.user?.avatar ? (
                          <img src={reply.user.avatar} alt={reply.user.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-foreground">
                            {reply.user?.username?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-foreground">{reply.user?.username}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{reply.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => handleLikeReply(review._id, reply._id)}
                            className={`flex items-center gap-1 text-xs transition-colors ${
                              reply.likes?.some(id => id.toString() === user?._id)
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-primary'
                            }`}
                          >
                            <ThumbsUp
                              className={`w-3 h-3 ${
                                reply.likes?.some(id => id.toString() === user?._id)
                                  ? 'fill-primary text-primary'
                                  : ''
                              }`}
                            />
                            {reply.likes?.length || 0}
                          </button>
                          <button
                            onClick={() => handleDislikeReply(review._id, reply._id)}
                            className={`flex items-center gap-1 text-xs transition-colors ${
                              reply.dislikes?.some(id => id.toString() === user?._id)
                                ? 'text-destructive'
                                : 'text-muted-foreground hover:text-destructive'
                            }`}
                          >
                            <ThumbsDown
                              className={`w-3 h-3 ${
                                reply.dislikes?.some(id => id.toString() === user?._id)
                                  ? 'fill-destructive text-destructive'
                                  : ''
                              }`}
                            />
                            {reply.dislikes?.length || 0}
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(review._id)
                              setMentionUser(reply.user?.username)
                              setReplyContent(`@${reply.user?.username} `)
                            }}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            Reply
                          </button>
                        </div>
                      </div>

                      {/* Edit/Delete Buttons for replies (only for own replies) */}
                      {user && reply.user?._id === user._id && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              // TODO: Implement edit reply
                              console.log('Edit reply:', reply._id)
                            }}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                            title="Edit reply"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmation({ type: 'reply', id: reply._id, reviewId: review._id })}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                            title="Delete reply"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )})}
        </div>

        {/* Load More Indicator */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isLoadingMore && (
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        )}

        {!hasMore && reviews.length > 0 && (
          <p className="text-center text-muted-foreground py-8">No more reviews to load</p>
        )}

        {reviews.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No reviews yet. Be the first to review!</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirmation(null)}>
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Delete {deleteConfirmation.type === 'review' ? 'Review' : 'Reply'}?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this {deleteConfirmation.type}? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmation(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
