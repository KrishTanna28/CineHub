"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Users, Film, Tv, User, Sparkles, Search, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"

const categories = [
  { id: 'all', label: 'All Communities' },
  { id: 'movie', label: 'Movies', icon: Film },
  { id: 'tv', label: 'TV Shows', icon: Tv },
  { id: 'actor', label: 'Actors & Cast', icon: User },
]

const sortOptions = [
  { id: 'popular', label: 'Popular' },
  { id: 'recent', label: 'Recently Created' },
  { id: 'members', label: 'Most Members' }
]

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    const category = searchParams.get('category')
    const sort = searchParams.get('sort')
    if (category) setSelectedCategory(category)
    if (sort) setSortBy(sort)
  }, [searchParams])

  // Debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchCommunities()
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [selectedCategory, sortBy, searchQuery])

  const fetchCommunities = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      params.append('sort', sortBy)
      if (searchQuery.trim()) params.append('search', searchQuery.trim())

      const response = await fetch(`/api/communities?${params}`)
      const data = await response.json()

      if (data.success) {
        setCommunities(data.data)
      }
    } catch (error) {
      console.error('Error fetching communities:', error)
      toast({
        title: "Error",
        description: "Failed to load communities",
        variant: "destructive"
      })
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
                      placeholder="Search communities..."
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
                    placeholder="Search communities..."
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

        {/* Communities List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading communities...</p>
            </div>
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No communities found</h3>
            <p className="text-muted-foreground mb-6">Be the first to create one!</p>
            {user && (
              <Link href="/communities/new">
                <Button>Create a Community</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((community) => {
              const CategoryIcon = categories.find(c => c.id === community.category)?.icon || Sparkles
              
              return (
                <Link 
                  key={community._id} 
                  href={`/communities/${community.slug}`}
                  className="block"
                >
                  <div className="bg-secondary/20 rounded-lg border border-border hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer overflow-hidden h-full">
                    {/* Banner */}
                    {community.banner ? (
                      <div className="h-24 bg-cover bg-center" style={{ backgroundImage: `url(${community.banner})` }}>
                        <div className="h-full bg-gradient-to-b from-transparent to-background/80" />
                      </div>
                    ) : (
                      <div className="h-24 bg-black" />
                    )}

                    <div className="p-4 -mt-8 relative">
                      {/* Icon */}
                      <div className="mb-3">
                        {community.icon ? (
                          <img 
                            src={community.icon} 
                            alt={community.name}
                            className="w-16 h-16 rounded-full border-4 border-background object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full border-4 border-background bg-black flex items-center justify-center">
                            <CategoryIcon className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-lg font-bold text-foreground line-clamp-1 hover:text-primary transition-colors">
                            {community.name}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                            community.category === 'movie' ? 'bg-blue-500/20 text-blue-400' :
                            community.category === 'tv' ? 'bg-purple-500/20 text-purple-400' :
                            community.category === 'actor' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {community.category}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {community.description}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {formatNumber(community.memberCount || 0)} members
                          </span>
                          <span>•</span>
                          <span>{community.postCount || 0} posts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
