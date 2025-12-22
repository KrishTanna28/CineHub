"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Users, Lock, Globe, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockMovies } from "@/lib/mock-data"

export default function WatchRoomsPage() {
  const [rooms, setRooms] = useState([
    {
      id: "1",
      title: "Cosmic Horizons Watch Party",
      movie: "Cosmic Horizons",
      host: "Alex Chen",
      participants: 5,
      maxParticipants: 10,
      isPrivate: false,
      status: "watching",
      currentTime: 45,
      totalDuration: 148,
    },
    {
      id: "2",
      title: "Midnight Chronicles - Season 1",
      movie: "Midnight Chronicles",
      host: "Sarah Johnson",
      participants: 3,
      maxParticipants: 8,
      isPrivate: true,
      status: "watching",
      currentTime: 32,
      totalDuration: 45,
    },
    {
      id: "3",
      title: "The Last Echo Discussion",
      movie: "The Last Echo",
      host: "Marcus Williams",
      participants: 7,
      maxParticipants: 12,
      isPrivate: false,
      status: "paused",
      currentTime: 89,
      totalDuration: 132,
    },
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-secondary/30 border-b border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Watch Rooms</h1>
            <p className="text-muted-foreground">Watch and discuss with friends in real-time</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-5 h-5" />
            Create Room
          </Button>
        </div>
      </div>

      {/* Active Rooms */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Active Rooms</h2>

        {rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Link key={room.id} href={`/watch-rooms/${room.id}`} className="cursor-pointer">
                <div className="bg-secondary/20 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors group cursor-pointer">
                  {/* Room Preview */}
                  <div className="relative h-40 bg-secondary flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                    <Play className="w-12 h-12 text-primary/50 group-hover:scale-110 transition-transform" />
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          room.status === "watching"
                            ? "bg-green-500/20 text-green-400"
                            : room.status === "paused"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Room Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {room.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">{room.movie}</p>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="w-full bg-secondary rounded-full h-1 mb-1">
                        <div
                          className="bg-primary h-1 rounded-full"
                          style={{ width: `${(room.currentTime / room.totalDuration) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {Math.floor(room.currentTime / 60)}:{String(room.currentTime % 60).padStart(2, "0")} /{" "}
                        {Math.floor(room.totalDuration / 60)}:{String(room.totalDuration % 60).padStart(2, "0")}
                      </p>
                    </div>

                    {/* Room Details */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>
                          {room.participants}/{room.maxParticipants}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {room.isPrivate ? (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>Private</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-4 h-4" />
                            <span>Public</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Host */}
                    <p className="text-xs text-muted-foreground mt-3">Hosted by {room.host}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">No active watch rooms</p>
            <Button onClick={() => setShowCreateModal(true)}>Create First Room</Button>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6 border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4">Create Watch Room</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Room Name</label>
                <input
                  type="text"
                  placeholder="e.g., Movie Night with Friends"
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Select Movie/Show</label>
                <select className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Choose a title...</option>
                  {mockMovies.map((movie) => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Max Participants</label>
                <input
                  type="number"
                  min="2"
                  max="20"
                  defaultValue="10"
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="private" className="w-4 h-4 cursor-pointer" />
                <label htmlFor="private" className="text-sm text-foreground cursor-pointer">
                  Make this room private
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1 bg-transparent">
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateModal(false)} className="flex-1">
                  Create Room
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
