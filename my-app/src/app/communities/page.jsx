"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Users, Film, Tv, User, Sparkles, Search, Filter, ChevronDown, ChevronUp, Heart, MessageCircle, Eye, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import useInfiniteScroll from "@/hooks/useInfiniteScroll"

const categories = [
  { id: 'all', label: 'All Posts' },
  { id: 'movie', label: 'Movies', icon: Film },
  { id: 'tv', label: 'TV Shows', icon: Tv },
  { id: 'actor', label: 'Actors & Cast', icon: User },
]

const sortOptions = [
  { id: 'recent', label: 'Most Recent' },
  { id: 'popular', label: 'Most Popular' },
  { id: 'hot', label: 'Trending' }
]

export default function CommunitiesPage() {
  const [allPosts, setAllPosts] = useState([]) // All loaded posts
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const { toast } = useToast()

  // Infinite scroll
  const loadMoreRef = useInfiniteScroll(
    () => {
      if (hasMore && !loadingMore && !searchQuery) {
        loadMorePosts()
      }
    },
    hasMore,
    loadingMore
  )

  useEffect(() => {
    const category = searchParams.get('category')
    const sort = searchParams.get('sort')
    if (category) setSelectedCategory(category)
    if (sort) setSortBy(sort)
  }, [searchParams])

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(1)
    setAllPosts([])
    setHasMore(true)
    fetchPosts(1)
  }, [selectedCategory, sortBy])

  // Client-side search through loaded posts
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) {
      return allPosts
    }

    const query = searchQuery.toLowerCase()
    return allPosts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      (post.content && post.content.toLowerCase().includes(query)) ||
      (post.community?.name && post.community.name.toLowerCase().includes(query))
    )
  }, [allPosts, searchQuery])

  // Debounced backend search if not found locally
  useEffect(() => {
    if (!searchQuery.trim()) return

    const debounceTimer = setTimeout(() => {
      // If local search found results, don't hit the backend
      if (filteredPosts.length > 0) return

      // If we've loaded all pages, no need to search backend
      if (!hasMore) return

      // Otherwise, search backend for posts we haven't loaded yet
      searchBackend()
    }, 800)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const fetchPosts = async (pageNum = 1) => {
    const isFirstPage = pageNum === 1
    if (isFirstPage) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      params.append('sort', sortBy)
      params.append('page', pageNum.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/communities/posts?${params}`)
      const data = await response.json()

      if (data.success) {
        if (isFirstPage) {
          setAllPosts(data.data)
        } else {
          setAllPosts(prev => [...prev, ...data.data])
        }
        setTotalPages(data.pagination.pages)
        setHasMore(pageNum < data.pagination.pages)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMorePosts = () => {
    if (!hasMore || loadingMore) return
    fetchPosts(page + 1)
  }

  const searchBackend = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      params.append('sort', sortBy)
      params.append('search', searchQuery.trim())
      params.append('limit', '100') // Get more results for search

      const response = await fetch(`/api/communities/posts?${params}`)
      const data = await response.json()

      if (data.success) {
        // Merge with existing posts, avoiding duplicates
        const existingIds = new Set(allPosts.map(p => p._id))
        const newPosts = data.data.filter(p => !existingIds.has(p._id))
        setAllPosts(prev => [...prev, ...newPosts])
      }
    } catch (error) {
      console.error('Error searching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const posted = new Date(date)
    const diffMs = now - posted
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return posted.toLocaleDateString()
  }

  return (
    <main className="min-h-screen bg-background">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar and Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            {/* Expandable Search on Mobile, Always Visible on Desktop */}
            <div className="relative flex items-center">
              {/* Mobile: Expandable */}
              <div className="lg:hidden">
                {!isSearchOpen ? (
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                    aria-label="Open search"
                  >
                    <Search className="w-5 h-5 text-foreground" />
                  </button>
                ) : (
                  <form onSubmit={(e) => e.preventDefault()} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => {
                        if (!searchQuery) setIsSearchOpen(false)
                      }}
                      autoFocus
                      className="w-64 pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 ease-in-out"
                      style={{
                        animation: 'expandSearch 0.3s ease-out'
                      }}
                    />
                  </form>
                )}
              </div>
              
              {/* Desktop: Always Visible */}
              <div className="hidden lg:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-80 pl-11 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="hidden lg:block">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="hidden lg:block">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Spacer to push Create button to the right */}
            <div className="flex-1"></div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground hover:bg-secondary/70 transition-all cursor-pointer"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Create Community Button */}
            {user && (
              <Link href="/communities/new">
                <Button className="gap-2 whitespace-nowrap cursor-pointer" aria-label="Create Community">
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Create Community</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Filters (collapsible) */}
          <div className={`lg:hidden mt-4 flex flex-col gap-3 transition-all duration-300 ${showFilters ? 'block' : 'hidden'}`}>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery ? 'No posts found' : 'No posts yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try a different search term' : 'Join a community and start posting!'}
            </p>
            {user && !searchQuery && (
              <Link href="/communities/new">
                <Button>Create a Community</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const CategoryIcon = categories.find(c => c.id === post.community?.category)?.icon || Sparkles
                
                return (
                  <Link 
                    key={post._id} 
                    href={`/communities/${post.community?.slug}`}
                    className="block"
                  >
                    <div className="bg-secondary/20 rounded-lg border border-border hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer overflow-hidden">
                      <div className="p-4">
                        {/* Community Info Header */}
                        <div className="flex items-center gap-3 mb-3">
                          {post.user?.avatar ? (
                            <img 
                              src={post.user?.avatar} 
                              alt={post.user?.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <CategoryIcon className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground text-sm truncate">
                                {post.community?.name || 'Unknown Community'}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                                post.community?.category === 'movie' ? 'bg-blue-500/20 text-blue-400' :
                                post.community?.category === 'tv' ? 'bg-purple-500/20 text-purple-400' :
                                post.community?.category === 'actor' ? 'bg-green-500/20 text-green-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {post.community?.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Posted by {post.user?.username || 'Anonymous'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(post.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Post Title */}
                        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 hover:text-primary transition-colors">
                          {post.title}
                        </h3>

                        {/* Post Content Preview */}
                        {post.content && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                            {post.content}
                          </p>
                        )}

                        {/* Post Images Preview */}
                        {post.images && post.images.length > 0 && (
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
        md:max-w-[680px]
        lg:max-w-[820px]
      "
                          >
                            <img
                              src={post.images[0]}
                              alt="Post preview"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                            {post.images.length > 1 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                +{post.images.length - 1} more images
                              </div>
                            )}
                          </div>
                        )}

                        {/* Post Stats */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border/50">
                          <span className="flex items-center gap-1.5">
                            <Heart className="w-4 h-4" />
                            {formatNumber(post.likesCount || 0)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MessageCircle className="w-4 h-4" />
                            {formatNumber(post.commentsCount || 0)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4" />
                            {formatNumber(post.views || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Load More Trigger & Loading State */}
            {!searchQuery && (
              <div ref={loadMoreRef} className="mt-8 flex justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading more posts...</span>
                  </div>
                )}
                {!loadingMore && !hasMore && allPosts.length > 0 && (
                  <p className="text-muted-foreground text-sm">
                    You've reached the end • {allPosts.length} posts loaded
                  </p>
                )}
              </div>
            )}

            {/* Search Results Info */}
            {searchQuery && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Found {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} matching "{searchQuery}"
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
