"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Menu, X, User, LogOut, Settings, Home, Compass, Users, Film, Tv, MessageCircle, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/UserContext"

const searchCategories = [
  { id: 'all', label: 'All' },
  { id: 'movies', label: 'Movies & TV' },
  { id: 'communities', label: 'Communities' },
  { id: 'posts', label: 'Posts' },
  { id: 'people', label: 'People' },
]

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [hasBackground, setHasBackground] = useState(false)
  const [activeSearchCategory, setActiveSearchCategory] = useState('all')
  const [searchResults, setSearchResults] = useState({
    movies: [],
    communities: [],
    posts: [],
    people: []
  })
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchRef = useRef(null)
  const router = useRouter()
  const { user, isLoading, logout } = useUser()

  // Perform search across all categories
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults({ movies: [], communities: [], posts: [], people: [] })
      return
    }

    setIsSearching(true)
    try {
      const [moviesRes, communitiesRes, postsRes, peopleRes] = await Promise.allSettled([
        // Movies & TV from TMDB (multi search)
        fetch(`/api/movies/search/multi?q=${encodeURIComponent(query)}&page=1`).then(r => r.json()),
        // Communities
        fetch(`/api/communities/search?q=${encodeURIComponent(query)}&limit=5`).then(r => r.json()),
        // Posts
        fetch(`/api/communities/posts?search=${encodeURIComponent(query)}&limit=5`).then(r => r.json()),
        // People/Users
        fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=5`).then(r => r.json())
      ])

      setSearchResults({
        movies: moviesRes.status === 'fulfilled' ? (moviesRes.value.data?.results?.slice(0, 5) || []) : [],
        communities: communitiesRes.status === 'fulfilled' ? (communitiesRes.value.communities || []) : [],
        posts: postsRes.status === 'fulfilled' ? (postsRes.value.data?.slice(0, 5) || []) : [],
        people: peopleRes.status === 'fulfilled' ? (peopleRes.value.users || []) : []
      })
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleSearch = (e) => {
    if (e) e.preventDefault()
    if (searchQuery.trim()) {
      setShowSearchDropdown(false)
      if (activeSearchCategory === 'all' || activeSearchCategory === 'movies') {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      } else if (activeSearchCategory === 'communities') {
        router.push(`/communities?search=${encodeURIComponent(searchQuery.trim())}`)
      } else if (activeSearchCategory === 'posts') {
        router.push(`/communities?search=${encodeURIComponent(searchQuery.trim())}&tab=posts`)
      } else if (activeSearchCategory === 'people') {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&tab=people`)
      }
      setIsOpen(false)
    }
  }

  // Debounced search for live results
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ movies: [], communities: [], posts: [], people: [] })
      setShowSearchDropdown(false)
      return
    }

    setShowSearchDropdown(true)
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, performSearch])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle scroll to show/hide navbar and change background
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Add background when scrolled past 100px
      setHasBackground(currentScrollY > 100)

      if (currentScrollY < 10) {
        // Always show navbar at top
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past 100px - hide navbar
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show navbar
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity cursor-pointer"
          onClick={() => setIsOpen(false)}
        />
      )}
      {/* Mobile Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-background border-r border-border z-50 md:hidden transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary cursor-pointer" onClick={() => setIsOpen(false)}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                C
              </div>
              <span>CineHub</span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto py-4">
            {/* User Profile Section */}
            {!isLoading && user && (
              <div className="px-4 py-3 mb-4 bg-secondary/30 mx-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-primary">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.fullName || user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="space-y-1 px-2">
              {!isLoading && user && (
                <>
                  <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:transition-colors cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    <Home className="w-5 h-5" />
                    <span>Home</span>
                  </Link>
                  <Link
                    href="/browse"
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:transition-colors cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    <Compass className="w-5 h-5" />
                    <span>Browse</span>
                  </Link>
                  <Link
                    href="/communities"
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:transition-colors cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    <Users className="w-5 h-5" />
                    <span>Communities</span>
                  </Link>
                </>
              )}
            </nav>

            {/* Search */}
            {user &&
              <div className="px-4 py-4 mt-4">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search everything..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </form>
              </div>
            }
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-border p-4 space-y-2">
            {!isLoading && (
              user ? (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors w-full cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors w-full cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsOpen(false)
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-destructive hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      router.push('/login')
                      setIsOpen(false)
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      router.push('/signup')
                      setIsOpen(false)
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-30 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
          } ${hasBackground ? 'bg-background/95 backdrop-blur border-b border-border' : 'bg-transparent border-none'}`}

      >
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-primary cursor-pointer" style={{ textShadow: hasBackground ? 'none' : '0 2px 4px rgba(0,0,0,0.8)' }}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                C
              </div>
              <span className="hidden sm:inline">CineHub</span>
            </Link>

            {/* Center Search - Desktop Only - Always Open */}
            {user && <div className="hidden md:flex flex-1 justify-center max-w-xl mx-8" ref={searchRef}>
              <div className="relative w-full">
                <form onSubmit={handleSearch} className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search anything..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-full text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                  )}
                </form>

                {/* Search Dropdown */}
                {showSearchDropdown && searchQuery.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
                    {/* Category Tabs */}
                    <div className="flex items-center gap-1 p-2 border-b border-border bg-secondary/30 overflow-x-auto">
                      {searchCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveSearchCategory(cat.id)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap cursor-pointer ${
                            activeSearchCategory === cat.id
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Results */}
                    <div className="p-2">
                      {isSearching ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        </div>
                      ) : (
                        <>
                          {/* Movies & TV Results */}
                          {(activeSearchCategory === 'all' || activeSearchCategory === 'movies') && searchResults.movies.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">Movies & TV</h4>
                              <div className="space-y-1">
                                {searchResults.movies.map((item) => (
                                  <Link
                                    key={`${item.mediaType}-${item.id}`}
                                    href={item.mediaType === 'person' ? `/actor/${item.id}` : item.mediaType === 'tv' ? `/tv/${item.id}` : `/details/${item.id}`}
                                    onClick={() => { setShowSearchDropdown(false); setSearchQuery(''); }}
                                    className="flex items-center gap-3 p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                                  >
                                    {item.poster ? (
                                      <img src={item.poster} alt="" className="w-10 h-14 object-cover rounded" />
                                    ) : (
                                      <div className="w-10 h-14 bg-secondary rounded flex items-center justify-center">
                                        {item.mediaType === 'person' ? <User className="w-5 h-5 text-muted-foreground" /> :
                                         item.mediaType === 'tv' ? <Tv className="w-5 h-5 text-muted-foreground" /> :
                                         <Film className="w-5 h-5 text-muted-foreground" />}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.mediaType === 'person' ? 'Actor' : item.mediaType === 'tv' ? 'TV Show' : 'Movie'}
                                        {item.releaseDate && ` • ${item.releaseDate.split('-')[0]}`}
                                      </p>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Communities Results */}
                          {(activeSearchCategory === 'all' || activeSearchCategory === 'communities') && searchResults.communities.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">Communities</h4>
                              <div className="space-y-1">
                                {searchResults.communities.map((community) => (
                                  <Link
                                    key={community._id}
                                    href={`/communities/${community.slug}`}
                                    onClick={() => { setShowSearchDropdown(false); setSearchQuery(''); }}
                                    className="flex items-center gap-3 p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                                  >
                                    {community.icon ? (
                                      <img src={community.icon} alt="" className="w-10 h-10 object-cover rounded-full" />
                                    ) : (
                                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                        <Users className="w-5 h-5 text-primary" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">r/{community.name}</p>
                                      <p className="text-xs text-muted-foreground truncate">{community.memberCount || 0} members</p>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Posts Results */}
                          {(activeSearchCategory === 'all' || activeSearchCategory === 'posts') && searchResults.posts.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">Posts</h4>
                              <div className="space-y-1">
                                {searchResults.posts.map((post) => (
                                  <Link
                                    key={post._id}
                                    href={`/communities/${post.community?.slug}`}
                                    onClick={() => { setShowSearchDropdown(false); setSearchQuery(''); }}
                                    className="flex items-center gap-3 p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                                  >
                                    <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center flex-shrink-0">
                                      <MessageCircle className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        in r/{post.community?.name} • by u/{post.user?.username}
                                      </p>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* People Results */}
                          {(activeSearchCategory === 'all' || activeSearchCategory === 'people') && searchResults.people.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">People</h4>
                              <div className="space-y-1">
                                {searchResults.people.map((person) => (
                                  <Link
                                    key={person._id}
                                    href={`/profile?userId=${person._id}`}
                                    onClick={() => { setShowSearchDropdown(false); setSearchQuery(''); }}
                                    className="flex items-center gap-3 p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                                  >
                                    {person.avatar ? (
                                      <img src={person.avatar} alt="" className="w-10 h-10 object-cover rounded-full" />
                                    ) : (
                                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-primary" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">u/{person.username}</p>
                                      {person.fullName && <p className="text-xs text-muted-foreground truncate">{person.fullName}</p>}
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* No Results */}
                          {!isSearching && 
                           searchResults.movies.length === 0 && 
                           searchResults.communities.length === 0 && 
                           searchResults.posts.length === 0 && 
                           searchResults.people.length === 0 && (
                            <div className="text-center py-8">
                              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
                            </div>
                          )}

                          {/* View All Results */}
                          {(searchResults.movies.length > 0 || searchResults.communities.length > 0 || searchResults.posts.length > 0 || searchResults.people.length > 0) && (
                            <button
                              onClick={handleSearch}
                              className="w-full mt-2 p-2 text-sm text-primary hover:bg-secondary rounded-lg transition-colors cursor-pointer text-center"
                            >
                              View all results for "{searchQuery}"
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>}

            {/* Right Side - Nav Icons + Profile */}
            <div className="hidden md:flex items-center gap-2">
              {!isLoading && user && (
                <>
                  {/* Navigation Icons */}
                  <Link href="/" className="p-2 text-foreground hover:text-primary transition-colors cursor-pointer" title="Home">
                    <Home className="w-5 h-5" />
                  </Link>
                  <Link href="/browse" className="p-2 text-foreground hover:text-primary transition-colors cursor-pointer" title="Browse">
                    <Compass className="w-5 h-5" />
                  </Link>
                  <Link href="/communities" className="p-2 text-foreground hover:text-primary transition-colors cursor-pointer" title="Communities">
                    <Users className="w-5 h-5" />
                  </Link>

                  <div/>
                </>
              )}

              {/* Profile / Auth Buttons */}
              {!isLoading && (
                user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                        <Avatar className="w-10 h-10 border-2 border-primary">
                          <AvatarImage src={user.avatar} alt={user.username} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{user.fullName || user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => router.push('/login')}>
                      Login
                    </Button>
                    <Button onClick={() => router.push('/signup')}>
                      Sign Up
                    </Button>
                  </div>
                )
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </nav>
    </>
  )
}
