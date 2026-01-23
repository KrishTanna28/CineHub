"use client"

import { useState } from "react"
import Link from "next/link"
import { Trash2, Share2, Pencil, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { mockMovies } from "@/lib/mock-data"

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState(mockMovies)

  const removeFromWatchlist = (id) => {
    setWatchlist(watchlist.filter((m) => m.id !== id))
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-secondary/30 border-b border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Watchlist</h1>
          <p className="text-muted-foreground">{watchlist.length} items</p>
        </div>
      </div>

      {/* Watchlist Items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {watchlist.length > 0 ? (
          <div className="space-y-4">
            {watchlist.map((movie) => (
              <div
                key={movie.id}
                className="bg-secondary/20 rounded-lg p-6 border border-border hover:border-primary/50 transition-colors flex items-center gap-6"
              >
                <img
                  src={movie.poster || "/placeholder.svg"}
                  alt={movie.title}
                  className="w-24 h-32 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <Link href={`/details/${movie.id}`} className="cursor-pointer">
                    <h3 className="text-xl font-bold text-foreground hover:text-primary transition-colors mb-2">
                      {movie.title}
                    </h3>
                  </Link>
                  <p className="text-muted-foreground mb-3 line-clamp-2">{movie.description}</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="rating-badge">{movie.rating}</span>
                    <span className="text-sm text-muted-foreground">{movie.year}</span>
                    <span className="text-sm text-muted-foreground">{movie.genres.join(", ")}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="cursor-pointer p-1">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.location.href = `/details/${movie.id}`}>
                        <Pencil className="w-4 h-4" />
                        Edit Watchlist Item
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => removeFromWatchlist(movie.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove from Watchlist
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">Your watchlist is empty</p>
            <Link href="/browse" className="cursor-pointer">
              <Button>Browse Content</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
