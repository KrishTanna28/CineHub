"use client"

import { useState } from "react"
import { Send, Users, Settings, Share2, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function WatchRoomPage({ params }) {
  const [messages, setMessages] = useState([
    {
      id: "1",
      user: "Alex Chen",
      avatar: "A",
      message: "This scene is amazing!",
      timestamp: "2:34 PM",
    },
    {
      id: "2",
      user: "Sarah Johnson",
      avatar: "S",
      message: "I didn't expect that plot twist",
      timestamp: "2:35 PM",
    },
    {
      id: "3",
      user: "Marcus Williams",
      avatar: "M",
      message: "The cinematography is incredible",
      timestamp: "2:36 PM",
    },
  ])
  const [newMessage, setNewMessage] = useState("")
  const [participants] = useState([
    { id: "1", name: "Alex Chen", status: "watching" },
    { id: "2", name: "Sarah Johnson", status: "watching" },
    { id: "3", name: "Marcus Williams", status: "watching" },
    { id: "4", name: "You", status: "watching" },
  ])

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        {
          id: String(messages.length + 1),
          user: "You",
          avatar: "Y",
          message: newMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ])
      setNewMessage("")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-screen">
        {/* Video Player */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Video Area */}
          <div className="flex-1 bg-black flex items-center justify-center relative">
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-16 h-16 bg-primary/40 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary rounded-full" />
                  </div>
                </div>
                <p className="text-foreground text-lg font-semibold">Video Player</p>
                <p className="text-muted-foreground text-sm mt-2">Cosmic Horizons</p>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-secondary/50 rounded-full h-1">
                  <div className="bg-primary h-1 rounded-full" style={{ width: "30%" }} />
                </div>
                <span className="text-white text-sm">45:32 / 2:28:00</span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Button size="sm" variant="outline" className="gap-2 bg-transparent text-white border-white/20">
                  <Volume2 className="w-4 h-4" />
                </Button>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-2 bg-transparent text-white border-white/20">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2 bg-transparent text-white border-white/20">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Room Info */}
          <div className="bg-secondary/30 border-b border-border p-4">
            <h1 className="text-xl font-bold text-foreground">Cosmic Horizons Watch Party</h1>
            <p className="text-sm text-muted-foreground">Hosted by Alex Chen • 4 watching</p>
          </div>
        </div>

        {/* Sidebar - Participants & Chat */}
        <div className="lg:col-span-1 flex flex-col bg-secondary/20 border-l border-border">
          {/* Participants */}
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">Participants ({participants.length})</h2>
            </div>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {participant.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{participant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {participant.status === "watching" ? "🟢 Watching" : "⏸ Paused"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                    {msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{msg.user}</p>
                      <p className="text-xs text-muted-foreground">{msg.timestamp}</p>
                    </div>
                    <p className="text-sm text-foreground break-words">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="border-t border-border p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Say something..."
                  className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button size="sm" onClick={handleSendMessage} className="gap-1">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
