"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Users, FileText, Plus, Clock, ThumbsUp, MessageCircle, Pin, Lock, Film, Tv, User as UserIcon, Sparkles, Trash2, UserCheck, UserX, Bell, Pencil, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import useInfiniteScroll from "@/hooks/useInfiniteScroll"
import Link from "next/link"

const categoryIcons = {
  movie: Film,
  tv: Tv,
  actor: UserIcon
}

export default function CommunityPage() {
  const [community, setCommunity] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sortBy, setSortBy] = useState('recent')
  const [isMember, setIsMember] = useState(false)
  const [joining, setJoining] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [processingRequest, setProcessingRequest] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()

  // Infinite scroll for posts
  const loadMoreRef = useInfiniteScroll(
    () => {
      if (hasMore && !loadingMore) {
        loadMorePosts()
      }
    },
    hasMore,
    loadingMore
  )

  useEffect(() => {
    fetchCommunity()
    setPage(1)
    setPosts([])
    setHasMore(true)
    fetchPosts(1)
  }, [params.slug])

  useEffect(() => {
    setPage(1)
    setPosts([])
    setHasMore(true)
    fetchPosts(1)
  }, [sortBy])

  const fetchCommunity = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      const response = await fetch(`/api/communities/${params.slug}`, { headers })
      const data = await response.json()

      if (data.success) {
        setCommunity(data.data)
        setIsMember(data.data.isMember || false)
        setHasPendingRequest(data.data.hasPendingRequest || false)
        setIsCreator(data.data.isCreator || false)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load community",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching community:', error)
      toast({
        title: "Error",
        description: "Failed to load community",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async (pageNum = 1) => {
    const isFirstPage = pageNum === 1
    if (isFirstPage) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      const response = await fetch(`/api/communities/${params.slug}/posts?sort=${sortBy}&page=${pageNum}&limit=10`, { headers })
      const data = await response.json()

      if (data.success) {
        if (isFirstPage) {
          setPosts(data.data)
        } else {
          setPosts(prev => [...prev, ...data.data])
        }
        setPage(pageNum)
        setHasMore(data.pagination && pageNum < data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMorePosts = () => {
    if (!hasMore || loadingMore) return
    fetchPosts(page + 1)
  }

  const handleJoinLeave = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to join communities",
        variant: "destructive"
      })
      router.push('/login')
      return
    }

    setJoining(true)
    try {
      const token = localStorage.getItem('token')

      // Handle cancel request
      if (hasPendingRequest) {
        const response = await fetch(`/api/communities/${params.slug}/requests`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        if (data.success) {
          setHasPendingRequest(false)
          toast({
            title: "Request Cancelled",
            description: data.message
          })
        }
        return
      }

      // Handle leave
      if (isMember) {
        const response = await fetch(`/api/communities/${params.slug}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        if (data.success) {
          setIsMember(false)
          toast({
            title: "Left Community",
            description: data.message
          })
          fetchCommunity()
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to leave community",
            variant: "destructive"
          })
        }
        return
      }

      // Handle join or request to join
      const response = await fetch(`/api/communities/${params.slug}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (data.success) {
        if (data.data.hasPendingRequest) {
          setHasPendingRequest(true)
          toast({
            title: "Request Sent",
            description: data.message
          })
        } else {
          setIsMember(true)
          toast({
            title: "Joined Community",
            description: data.message
          })
          fetchCommunity()
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update membership",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating membership:', error)
      toast({
        title: "Error",
        description: "Failed to update membership",
        variant: "destructive"
      })
    } finally {
      setJoining(false)
    }
  }

  const handleJoinRequest = async (userId, action) => {
    setProcessingRequest(userId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/communities/${params.slug}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, action })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: action === 'approve' ? 'Request Approved' : 'Request Rejected',
          description: data.message
        })
        fetchCommunity() // Refresh to update pending requests
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to process request',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error processing request:', error)
      toast({
        title: 'Error',
        description: 'Failed to process request',
        variant: 'destructive'
      })
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleDeleteCommunity = async () => {
    if (!confirm('Are you sure you want to delete this community? This action cannot be undone and will delete all posts.')) {
      return
    }

    setDeleting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/communities/${params.slug}/delete`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Community Deleted',
          description: data.message
        })
        router.push('/communities')
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to delete community',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error deleting community:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete community',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
    }
  }



  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months}mo ago`
    return `${Math.floor(months / 12)}y ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading community...</p>
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Community not found</p>
      </div>
    )
  }

  const CategoryIcon = categoryIcons[community.category] || Sparkles

  return (
    <main className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-32 sm:h-48 bg-black overflow-hidden">
        {community.banner && (
          <img src={community.banner} alt={community.name} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Community Header */}
      <div className="bg-secondary/30 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col items-start gap-3 sm:gap-4">
            {/* Icon */}
            <div className="relative -mt-10 sm:-mt-14 flex-shrink-0">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-background border-4 border-background rounded-full overflow-hidden shadow-lg">
                {community.icon ? (
                  <img src={community.icon} alt={community.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-black flex items-center">
                    <CategoryIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="w-full min-w-0">
              {/* Line 1: Community Name - full width */}
              <h1 className="text-lg sm:text-2xl font-bold text-foreground leading-tight">
                {community.name}
              </h1>

              {/* Line 2: Badges (left) + Buttons (right) - NO WRAP */}
              <div className="flex items-center justify-between gap-2 mt-1">
                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                    <CategoryIcon className="w-3 h-3" />
                    {community.category}
                  </span>
                  {community.isPrivate && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-secondary text-foreground rounded text-xs">
                      <Lock className="w-3 h-3" />
                      Private
                    </span>
                  )}
                </div>

                {/* All actions in dropdown menu */}
                <div className="flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="cursor-pointer p-1.5">
                        <MoreVertical className="w-5 h-5 hover:text-primary"/>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(isMember || isCreator) && (
                        <DropdownMenuItem onClick={() => window.location.href = `/communities/${params.slug}/new-post`}>
                          <Plus className="w-4 h-4" />
                          Create Post
                        </DropdownMenuItem>
                      )}
                      {!isCreator && (
                        <DropdownMenuItem
                          onClick={handleJoinLeave}
                          disabled={joining}
                        >
                          {joining ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : isMember ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                          {joining ? "Processing..." :
                            isMember ? "Leave Community" :
                              hasPendingRequest ? "Cancel Request" :
                                community.isPrivate ? "Request to Join" : "Join Community"}
                        </DropdownMenuItem>
                      )}
                      {isCreator && (
                        <>
                          <DropdownMenuItem onClick={() => window.location.href = `/communities/${params.slug}/edit`}>
                            <Pencil className="w-4 h-4" />
                            Edit Community
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={handleDeleteCommunity}
                            disabled={deleting}
                          >
                            {deleting ? (
                              <div className="w-4 h-4 border-2 border-border border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            {deleting ? "Deleting..." : "Delete Community"}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Line 3: Description */}
              <p className="text-muted-foreground mt-2 text-sm line-clamp-2">{community.description}</p>

              {/* Line 4: Stats */}
              <div className="flex items-center gap-3 mt-2 text-xs sm:text-sm text-muted-foreground">
                <span><strong className="text-foreground">{formatNumber(community.memberCount)}</strong> members</span>
                <span><strong className="text-foreground">{formatNumber(community.postCount)}</strong> posts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Join Requests Section - Only visible to creator */}
        {isCreator && community.pendingRequests && community.pendingRequests.length > 0 && (
          <div className="mb-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold text-foreground">
                Pending Join Requests ({community.pendingRequests.length})
              </h2>
            </div>
            <div className="space-y-3">
              {community.pendingRequests.map((request) => (
                <div
                  key={request.user._id}
                  className="flex items-center justify-between bg-background/50 rounded-lg p-4 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                      {request.user.avatar ? (
                        <img src={request.user.avatar} alt={request.user.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        request.user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{request.user.fullName || request.user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        Requested {formatTimeAgo(request.requestedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleJoinRequest(request.user._id, 'approve')}
                      disabled={processingRequest === request.user._id}
                      size="sm"
                      className="gap-2 cursor-pointer"
                    >
                      {processingRequest === request.user._id ? (
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      {processingRequest === request.user._id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => handleJoinRequest(request.user._id, 'reject')}
                      disabled={processingRequest === request.user._id}
                      variant="outline"
                      size="sm"
                      className="gap-2 cursor-pointer"
                    >
                      {processingRequest === request.user._id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <UserX className="w-4 h-4" />
                      )}
                      {processingRequest === request.user._id ? 'Processing...' : 'Reject'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sort Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Posts</h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="recent">Most Recent</option>
            <option value="top">Top Rated</option>
            <option value="hot">Hot</option>
          </select>
        </div>

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-secondary/20 rounded-lg border border-border">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-4">Be the first to create a post in this community!</p>
            {isMember && (
              <Link href={`/communities/${params.slug}/new-post`}>
                <Button className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link key={post._id} href={`/communities/${params.slug}/posts/${post._id}`}>
                <div className="bg-secondary/20 hover:bg-secondary/30 rounded-lg border border-border p-4 transition-colors cursor-pointer">
                  <div className="flex gap-4">
                    {/* Vote Section */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <ThumbsUp className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">
                        {post.likes?.length || 0}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {post.isPinned && (
                          <Pin className="w-4 h-4 text-primary" />
                        )}
                        {post.isLocked && (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          u/<span className="font-bold text-primary">{post.user?.username || 'Unknown'}</span> • {formatTimeAgo(post.createdAt)}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                        {post.title}
                      </h3>

                      {/* Post Images */}
                      {post.images?.length > 0 && (
                        <div className="mt-3 mb-2">
                          <div
                            className="
        bg-black/80
        border border-border
        rounded-lg
        overflow-hidden
        mx-auto
        flex items-center justify-center
        aspect-[16/9]

        w-full
        max-w-[90vw]
        sm:max-w-[420px]
        md:max-w-[480px]
        lg:max-w-[520px]
      "
                          >
                            <img
                              src={post.images[0]}
                              alt="Post preview"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>

                          {post.images.length > 1 && (
                            <p className="text-xs text-muted-foreground mt-1 text-center">
                              +{post.images.length - 1} more image{post.images.length > 2 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      )}
                      {/* Post Stats */}
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments?.length || 0} comments</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{post.views || 0} views</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Load More Trigger & Loading State */}
            <div ref={loadMoreRef} className="mt-6 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading more posts...</span>
                </div>
              )}
              {!loadingMore && !hasMore && posts.length > 0 && (
                <p className="text-muted-foreground text-sm">
                  You've reached the end • {posts.length} posts loaded
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}