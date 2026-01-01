"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Menu, X, User, LogOut, Settings } from "lucide-react"
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

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [hasBackground, setHasBackground] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const router = useRouter()
  const { user, isLoading, logout } = useUser()

  const handleSearch = (e) => {
    if (e) e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsOpen(false)
    }
  }

  // Debounced search - triggers 2 seconds after user stops typing
  useEffect(() => {
    if (!searchQuery.trim()) return

    const debounceTimer = setTimeout(() => {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsOpen(false)
    }, 750)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, router])

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
      <div className={`fixed top-0 left-0 h-full w-64 bg-background border-r border-border z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
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
                className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                <span>Home</span>
              </Link>
                  <Link
                    href="/browse"
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    <span>Browse</span>
                  </Link>
                  <Link
                    href="/communities"
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    <span>Communities</span>
                  </Link>
                  <Link
                    href="/watch-rooms"
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    <span>Watch Rooms</span>
                    </Link>
                </>
              )}
            </nav>

            {/* Search */}
            <div className="px-4 py-4 mt-4">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search movies, shows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </form>
            </div>
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
        className={`fixed top-0 left-0 right-0 z-30 transition-transform duration-300 ${
  isVisible ? 'translate-y-0' : '-translate-y-full'
} ${hasBackground ? 'bg-background/95 backdrop-blur border-b border-border' : 'bg-transparent border-none'}`}

      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-primary cursor-pointer" style={{ textShadow: hasBackground ? 'none' : '0 2px 4px rgba(0,0,0,0.8)' }}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                C
              </div>
              <span className="hidden sm:inline">CineHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {!isLoading && user && (
              <>
            <Link href="/" className="text-foreground hover:text-primary transition-colors cursor-pointer">
              Home
            </Link>
                <Link href="/browse" className="text-foreground hover:text-primary transition-colors cursor-pointer">
                  Browse
                </Link>
                <Link href="/communities" className="text-foreground hover:text-primary transition-colors cursor-pointer">
                  Communities
                </Link>
                <Link href="/watch-rooms" className="text-foreground hover:text-primary transition-colors cursor-pointer">
                  Watch Rooms
                </Link>
              </>
            )}
          </div>

          {/* Search - Expandable */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="relative flex items-center">
              {!isSearchOpen ? (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                  aria-label="Open search"
                >
                  <Search className="w-5 h-5 text-foreground" />
                </button>
              ) : (
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search movies, shows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
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
          </div>

          {/* Profile / Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
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
