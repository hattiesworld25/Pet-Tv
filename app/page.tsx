"use client"

// Pet TV - running app version, based on pet-tv-page-v2.tsx (the original pet-tv-page.tsx is untouched)
// This copy lives in pet-tv-app/app/page.tsx and has two extra hardening fixes:
// YouTube commands are sent only to the youtube.com origin, and favorites are
// loaded after mount so the first screen matches the server-rendered one.
// Changes in v2: real YouTube play/pause + mute (enablejsapi=1 + postMessage commands),
// and Favorites: heart on each card and in the player, a favorites-only view,
// and favorites saved in the browser (localStorage key: "pet-tv-favorites").

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Volume2, VolumeX, Timer, Tv, ArrowLeft, Sparkles, AlertCircle, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Channel = {
  id: string
  name: string
  emoji: string
  description: string
  videoUrl: string
  thumbnail: string
  petType: "cat" | "dog" | "both"
  color: string
}

const channels: Channel[] = [
  {
    id: "birds",
    name: "Bird Watching",
    emoji: "🐦",
    description: "Backyard birds chirping and flying",
    videoUrl: "https://www.youtube.com/embed/xbs7FT7dXYc?autoplay=1&mute=0&controls=0&enablejsapi=1&loop=1&playlist=xbs7FT7dXYc",
    thumbnail: "bg-gradient-to-br from-sky-400 to-blue-500",
    petType: "cat",
    color: "from-sky-400 to-blue-500"
  },
  {
    id: "fish",
    name: "Aquarium",
    emoji: "🐠",
    description: "Colorful fish swimming peacefully",
    videoUrl: "https://www.youtube.com/embed/oy5dJkKbIlg?autoplay=1&mute=0&controls=0&enablejsapi=1&loop=1&playlist=oy5dJkKbIlg",
    thumbnail: "bg-gradient-to-br from-cyan-400 to-teal-500",
    petType: "cat",
    color: "from-cyan-400 to-teal-500"
  },
  {
    id: "squirrels",
    name: "Squirrel TV",
    emoji: "🐿️",
    description: "Squirrels playing in the garden",
    videoUrl: "https://www.youtube.com/embed/gvPXHxWLuxk?autoplay=1&mute=0&controls=0&enablejsapi=1&loop=1&playlist=gvPXHxWLuxk",
    thumbnail: "bg-gradient-to-br from-amber-400 to-orange-500",
    petType: "dog",
    color: "from-amber-400 to-orange-500"
  },
  {
    id: "mice",
    name: "Mouse Hunt",
    emoji: "🐭",
    description: "Little critters scurrying around",
    videoUrl: "https://www.youtube.com/embed/J_gPJRjS_-I?autoplay=1&mute=0&controls=0&enablejsapi=1&loop=1&playlist=J_gPJRjS_-I",
    thumbnail: "bg-gradient-to-br from-gray-400 to-slate-500",
    petType: "cat",
    color: "from-gray-400 to-slate-500"
  },
  {
    id: "nature",
    name: "Nature Sounds",
    emoji: "🌳",
    description: "Relaxing forest ambience",
    videoUrl: "https://www.youtube.com/embed/d1XNAbbJRFc?autoplay=1&mute=0&controls=0&enablejsapi=1&loop=1&playlist=d1XNAbbJRFc",
    thumbnail: "bg-gradient-to-br from-green-400 to-emerald-500",
    petType: "both",
    color: "from-green-400 to-emerald-500"
  },
  {
    id: "beach",
    name: "Beach Waves",
    emoji: "🌊",
    description: "Calming ocean sounds",
    videoUrl: "https://www.youtube.com/embed/bn9F19Hi1Lk?autoplay=1&mute=0&controls=0&enablejsapi=1&loop=1&playlist=bn9F19Hi1Lk",
    thumbnail: "bg-gradient-to-br from-blue-400 to-indigo-500",
    petType: "both",
    color: "from-blue-400 to-indigo-500"
  },
  {
    id: "laser",
    name: "Laser Pointer",
    emoji: "🔴",
    description: "Moving red dot for cats to chase",
    videoUrl: "https://www.youtube.com/embed/z3U0udLH974?autoplay=1&mute=0&controls=0&enablejsapi=1&loop=1&playlist=z3U0udLH974",
    thumbnail: "bg-gradient-to-br from-red-400 to-rose-500",
    petType: "cat",
    color: "from-red-400 to-rose-500"
  },
  {
    id: "fireplace",
    name: "Cozy Fireplace",
    emoji: "🔥",
    description: "Warm crackling fireplace",
    videoUrl: "https://www.youtube.com/embed/L_LUpnjgPso?autoplay=1&mute=0&controls=0&enablejsapi=1&loop=1&playlist=L_LUpnjgPso",
    thumbnail: "bg-gradient-to-br from-orange-400 to-red-500",
    petType: "both",
    color: "from-orange-400 to-red-500"
  }
]

type TimerOption = {
  label: string
  minutes: number | null // null means no timer (true "all day")
}

const timerOptions: TimerOption[] = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "All day", minutes: null } // Fixed: null means no auto-stop
]

// Floating decoration components
function FloatingBubble({ delay = 0, duration = 20, left = "20%" }: { delay?: number; duration?: number; left?: string }) {
  return (
    <motion.div
      className="absolute w-16 h-16 rounded-full bg-white/5 backdrop-blur-sm border border-white/10"
      style={{ left, bottom: "-10%" }}
      animate={{
        y: [0, -1000],
        x: [0, Math.random() * 100 - 50],
        opacity: [0, 0.6, 0.6, 0],
        scale: [0.5, 1, 1, 0.5]
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  )
}

function FloatingPaw({ delay = 0, duration = 15, left = "30%" }: { delay?: number; duration?: number; left?: string }) {
  return (
    <motion.div
      className="absolute text-4xl opacity-20"
      style={{ left, bottom: "-10%" }}
      animate={{
        y: [0, -1000],
        x: [0, Math.random() * 80 - 40],
        rotate: [0, 360],
        opacity: [0, 0.3, 0.3, 0]
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      🐾
    </motion.div>
  )
}

function FloatingYarn({ delay = 0, left = "60%" }: { delay?: number; left?: string }) {
  return (
    <motion.div
      className="absolute text-3xl"
      style={{ left, top: "-5%" }}
      animate={{
        y: [0, 1000],
        x: [0, Math.random() * 60 - 30],
        rotate: [0, 720],
        opacity: [0, 0.4, 0.4, 0]
      }}
      transition={{
        duration: 18,
        delay,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      🧶
    </motion.div>
  )
}

function FloatingLeaf({ delay = 0, left = "70%" }: { delay?: number; left?: string }) {
  return (
    <motion.div
      className="absolute text-3xl"
      style={{ left, top: "-5%" }}
      animate={{
        y: [0, 1000],
        x: [0, Math.random() * 100 - 50],
        rotate: [0, 360, 720],
        opacity: [0, 0.5, 0.5, 0]
      }}
      transition={{
        duration: 20,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      🍃
    </motion.div>
  )
}

// Custom Pet TV Logo Icon
function PetTVIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* TV Screen */}
        <rect x="15" y="20" width="70" height="50" rx="8" fill="url(#gradient1)" />
        <rect x="20" y="25" width="60" height="40" rx="4" fill="#1a1a2e" />
        
        {/* Play button */}
        <polygon points="42,38 42,57 58,47.5" fill="url(#gradient2)" />
        
        {/* Antenna */}
        <line x1="35" y1="20" x2="25" y2="5" stroke="url(#gradient2)" strokeWidth="3" strokeLinecap="round" />
        <line x1="65" y1="20" x2="75" y2="5" stroke="url(#gradient2)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="25" cy="5" r="3" fill="#ec4899" />
        <circle cx="75" cy="5" r="3" fill="#a855f7" />
        
        {/* Legs */}
        <rect x="25" y="70" width="15" height="8" rx="4" fill="url(#gradient1)" />
        <rect x="60" y="70" width="15" height="8" rx="4" fill="url(#gradient1)" />
        
        {/* Paw print on screen */}
        <circle cx="70" cy="32" r="2" fill="#ec4899" opacity="0.6" />
        <circle cx="66" cy="35" r="1.5" fill="#ec4899" opacity="0.6" />
        <circle cx="70" cy="37" r="1.5" fill="#ec4899" opacity="0.6" />
        <circle cx="74" cy="35" r="1.5" fill="#ec4899" opacity="0.6" />
        
        <defs>
          <linearGradient id="gradient1" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0" y1="0" x2="100" y2="0">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  )
}

export default function Home() {
  const [view, setView] = useState<"home" | "player">("home")
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [selectedTimer, setSelectedTimer] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [petFilter, setPetFilter] = useState<"all" | "cat" | "dog">("all")
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  // v2: Favorites - channel ids, saved in the browser (loaded just below)
  const [favorites, setFavorites] = useState<string[]>([])
  const [favoritesLoaded, setFavoritesLoaded] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Load saved favorites after mount, so the first render matches what the
  // server rendered and React does not warn about mismatched favorites.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("pet-tv-favorites")
      const parsed = saved ? JSON.parse(saved) : []
      if (Array.isArray(parsed)) {
        setFavorites(parsed.filter((id: unknown) => typeof id === "string"))
      }
    } catch {
      // Storage unavailable - favorites just start empty
    }
    setFavoritesLoaded(true)
  }, [])
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { toast } = useToast()

  // v2: actually control the YouTube iframe. Every embed URL now carries
  // enablejsapi=1, which lets this page send the player real commands.
  const sendYouTubeCommand = (func: "playVideo" | "pauseVideo" | "mute" | "unMute") => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
      "https://www.youtube.com"
    )
  }

  // v2: keep favorites saved in the browser so they survive a reload
  useEffect(() => {
    if (!favoritesLoaded) return
    try {
      window.localStorage.setItem("pet-tv-favorites", JSON.stringify(favorites))
    } catch {
      // Storage unavailable (private browsing etc.) - favorites just won't persist
    }
  }, [favorites, favoritesLoaded])

  const toggleFavorite = (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId)
    const isFavorite = favorites.includes(channelId)
    setFavorites(
      isFavorite
        ? favorites.filter((id) => id !== channelId)
        : [...favorites, channelId]
    )
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites ❤️",
      description: channel ? channel.name : undefined,
    })
  }

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    if (view === "player" && isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [view, isPlaying, showControls])

  // Timer countdown - Fixed to properly handle "All day" (null timer)
  useEffect(() => {
    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    // Only start timer if we have a time remaining value and we're playing
    if (timeRemaining !== null && timeRemaining > 0 && isPlaying && view === "player") {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            // Timer expired - stop playback
            setIsPlaying(false)
            sendYouTubeCommand("pauseVideo")
            toast({
              title: "Timer finished! ⏰",
              description: "Playback has been stopped automatically.",
            })
            // Return to home after a short delay
            setTimeout(() => {
              setView("home")
            }, 2000)
            return null
          }
          return prev - 1
        })
      }, 60000) // Every minute
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [timeRemaining, isPlaying, view, toast])

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel)
    setView("player")
    setIsPlaying(true)
    setIsMuted(false) // v2: a fresh embed starts with sound on, so match that
    setShowControls(true)
    setIsLoading(true)
    
    // Set timer if one was selected
    if (selectedTimer !== null) {
      setTimeRemaining(selectedTimer)
      toast({
        title: "Timer set! ⏰",
        description: `Playback will stop after ${formatTimeRemaining(selectedTimer)}`,
      })
    } else {
      setTimeRemaining(null) // No timer - play indefinitely
    }

    // Simulate loading complete
    setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }

  const handleBackToHome = () => {
    sendYouTubeCommand("pauseVideo") // v2: stop the real video, not just the app state
    // Clean up timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    
    setView("home")
    setIsPlaying(false)
    setSelectedChannel(null)
    setTimeRemaining(null)
    setShowControls(true)
    setIsLoading(false)
  }

  const togglePlayPause = () => {
    const newPlayingState = !isPlaying
    setIsPlaying(newPlayingState)
    setShowControls(true)
    // v2: send the command to the YouTube player itself
    sendYouTubeCommand(newPlayingState ? "playVideo" : "pauseVideo")
    
    if (newPlayingState) {
      toast({
        title: "Playing ▶️",
        description: "Your pet is enjoying the show!",
      })
    } else {
      toast({
        title: "Paused ⏸️",
        description: "Playback paused",
      })
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    setShowControls(true)
    // v2: send the command to the YouTube player itself
    sendYouTubeCommand(isMuted ? "unMute" : "mute")
    toast({
      title: isMuted ? "Sound on 🔊" : "Muted 🔇",
      description: isMuted ? "Audio enabled" : "Audio muted",
    })
  }

  const handleMouseMove = () => {
    if (view === "player") {
      setShowControls(true)
    }
  }

  const handleTimerSelect = (minutes: number | null) => {
    setSelectedTimer(selectedTimer === minutes ? null : minutes)
    
    if (minutes === null) {
      toast({
        title: "All day mode 🌞",
        description: "No auto-stop timer - playback will continue until you stop it",
      })
    } else if (selectedTimer !== minutes) {
      toast({
        title: "Timer selected ⏰",
        description: `Will auto-stop after ${formatTimeRemaining(minutes)}`,
      })
    } else {
      toast({
        title: "Timer removed",
        description: "No auto-stop timer set",
      })
    }
  }

  const formatTimeRemaining = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${mins}m`
  }

  const filteredChannels = channels.filter((channel) => {
    if (showFavoritesOnly && !favorites.includes(channel.id)) return false
    if (petFilter === "all") return true
    if (petFilter === "cat") return channel.petType === "cat" || channel.petType === "both"
    if (petFilter === "dog") return channel.petType === "dog" || channel.petType === "both"
    return true
  })

  return (
    <div 
      className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated Background Decorations - Only on home view */}
      {view === "home" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating Bubbles */}
          <FloatingBubble delay={0} duration={25} left="10%" />
          <FloatingBubble delay={5} duration={20} left="30%" />
          <FloatingBubble delay={10} duration={22} left="50%" />
          <FloatingBubble delay={15} duration={24} left="70%" />
          <FloatingBubble delay={3} duration={26} left="85%" />
          
          {/* Floating Paws */}
          <FloatingPaw delay={0} duration={18} left="15%" />
          <FloatingPaw delay={6} duration={16} left="45%" />
          <FloatingPaw delay={12} duration={17} left="75%" />
          
          {/* Floating Yarn (for cat content) */}
          {(petFilter === "all" || petFilter === "cat") && (
            <>
              <FloatingYarn delay={2} left="25%" />
              <FloatingYarn delay={10} left="65%" />
            </>
          )}
          
          {/* Floating Leaves */}
          <FloatingLeaf delay={4} left="20%" />
          <FloatingLeaf delay={14} left="80%" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Home View */}
        {view === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen p-4 md:p-8 lg:p-12 relative z-10"
          >
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="text-center mb-8 md:mb-12">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: -20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="flex items-center justify-center gap-4 mb-6"
                >
                  <PetTVIcon className="w-16 h-16 md:w-20 md:h-20" />
                </motion.div>
                
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 tracking-tight">
                    <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-2xl">
                      Pet TV
                    </span>
                  </h1>
                  <motion.p 
                    className="text-xl md:text-2xl text-purple-200 mb-2 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Entertainment for your furry friends 🐾
                  </motion.p>
                  <motion.p 
                    className="text-sm md:text-base text-purple-300/70 italic flex items-center justify-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Keep them entertained while you&apos;re away
                  </motion.p>
                </motion.div>
              </div>

              {/* Settings Panel */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 150 }}
                className="mb-8"
              >
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Pet Type Filter */}
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-purple-200 mb-3 block flex items-center gap-2">
                          <Tv className="w-4 h-4" />
                          Pet Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            onClick={() => setPetFilter("all")}
                            variant={petFilter === "all" ? "default" : "outline"}
                            className={`transition-all duration-200 ${
                              petFilter === "all"
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg scale-105"
                                : "bg-white/5 hover:bg-white/10 text-purple-200 border-white/20"
                            }`}
                          >
                            All Pets
                          </Button>
                          <Button
                            onClick={() => setPetFilter("cat")}
                            variant={petFilter === "cat" ? "default" : "outline"}
                            className={`transition-all duration-200 ${
                              petFilter === "cat"
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg scale-105"
                                : "bg-white/5 hover:bg-white/10 text-purple-200 border-white/20"
                            }`}
                          >
                            🐱 Cats
                          </Button>
                          <Button
                            onClick={() => setPetFilter("dog")}
                            variant={petFilter === "dog" ? "default" : "outline"}
                            className={`transition-all duration-200 ${
                              petFilter === "dog"
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg scale-105"
                                : "bg-white/5 hover:bg-white/10 text-purple-200 border-white/20"
                            }`}
                          >
                            🐶 Dogs
                          </Button>
                        </div>
                      </div>

                      {/* Timer */}
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-purple-200 mb-3 block flex items-center gap-2">
                          <Timer className="w-4 h-4" />
                          Auto-Stop Timer
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {timerOptions.map((option) => (
                            <Button
                              key={option.label}
                              onClick={() => handleTimerSelect(option.minutes)}
                              variant="outline"
                              size="sm"
                              className={`transition-all duration-200 ${
                                selectedTimer === option.minutes
                                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-purple-500 shadow-lg scale-105"
                                  : "bg-white/5 hover:bg-white/10 text-purple-200 border-white/20"
                              }`}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Channel Grid */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                    <Tv className="w-6 h-6 md:w-8 md:h-8" />
                    Available Channels
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                      variant="outline"
                      size="sm"
                      className={`transition-all duration-200 ${
                        showFavoritesOnly
                          ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-500 shadow-lg"
                          : "bg-white/5 hover:bg-white/10 text-purple-200 border-white/20"
                      }`}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${showFavoritesOnly ? "fill-current" : ""}`} />
                      Favorites ({favorites.length})
                    </Button>
                    <Badge className="bg-purple-500/30 text-purple-100 border-purple-400/30 text-sm md:text-base px-3 py-1">
                      {filteredChannels.length} {filteredChannels.length === 1 ? "channel" : "channels"}
                    </Badge>
                  </div>
                </div>

                {filteredChannels.length === 0 ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-16"
                  >
                    <Card className="bg-white/5 backdrop-blur-lg border-white/10 max-w-md mx-auto">
                      <CardContent className="p-8">
                        <AlertCircle className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {showFavoritesOnly && favorites.length === 0 ? "No favorites yet" : "No channels found"}
                        </h3>
                        <p className="text-purple-200/70">
                          {showFavoritesOnly && favorites.length === 0
                            ? "Tap the heart on any channel to save it here."
                            : "Try selecting a different pet type to see more channels."}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredChannels.map((channel, index) => (
                      <motion.div
                        key={channel.id}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ 
                          delay: 0.05 * index,
                          type: "spring",
                          stiffness: 200,
                          damping: 20
                        }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card
                          className="cursor-pointer overflow-hidden bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 hover:border-white/30 transition-all group shadow-xl hover:shadow-2xl"
                          onClick={() => handleChannelSelect(channel)}
                        >
                          <div className={`h-32 md:h-40 bg-gradient-to-br ${channel.thumbnail} flex items-center justify-center relative overflow-hidden`}>
                            <motion.div 
                              className="text-5xl md:text-6xl"
                              whileHover={{ scale: 1.2, rotate: 10 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              {channel.emoji}
                            </motion.div>
                            <button
                              type="button"
                              aria-label={favorites.includes(channel.id) ? "Remove from favorites" : "Add to favorites"}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(channel.id)
                              }}
                              className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
                            >
                              <Heart className={`w-5 h-5 ${favorites.includes(channel.id) ? "text-pink-500 fill-pink-500" : "text-white"}`} />
                            </button>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                whileHover={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                <Play className="w-12 h-12 md:w-16 md:h-16 text-white drop-shadow-lg" />
                              </motion.div>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-bold text-base md:text-lg text-white mb-1 line-clamp-1">
                              {channel.name}
                            </h3>
                            <p className="text-xs md:text-sm text-purple-200/70 mb-3 line-clamp-2">
                              {channel.description}
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {channel.petType === "cat" && (
                                <Badge className="bg-pink-500/20 text-pink-200 border-pink-500/30 text-xs">
                                  🐱 Cat
                                </Badge>
                              )}
                              {channel.petType === "dog" && (
                                <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30 text-xs">
                                  🐶 Dog
                                </Badge>
                              )}
                              {channel.petType === "both" && (
                                <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30 text-xs">
                                  🐾 Both
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Footer */}
              <motion.div 
                className="text-center mt-12 text-purple-300/50 text-xs md:text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  💡 Tip: Position your screen where your pet can comfortably watch
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Player View */}
        {view === "player" && selectedChannel && (
          <motion.div
            key="player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen w-full relative bg-black"
          >
            {/* Video Player */}
            <div className="w-full h-screen relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 z-20">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="mb-4"
                    >
                      <PetTVIcon className="w-20 h-20 mx-auto" />
                    </motion.div>
                    <p className="text-white text-xl font-semibold">Loading {selectedChannel.name}...</p>
                    <p className="text-purple-300 text-sm mt-2">Get your pet ready! 🐾</p>
                  </motion.div>
                </div>
              )}
              
              <iframe
                ref={iframeRef}
                src={selectedChannel.videoUrl}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={selectedChannel.name}
              />
            </div>

            {/* Controls Overlay */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70 pointer-events-none"
                >
                  {/* Top Bar */}
                  <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between pointer-events-auto">
                    <Button
                      onClick={handleBackToHome}
                      variant="outline"
                      className="bg-black/50 hover:bg-black/70 text-white border-white/30 backdrop-blur-sm transition-all"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-end">
                      {timeRemaining !== null && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                        >
                          <Badge className="bg-purple-500/90 text-white text-sm md:text-base px-3 md:px-4 py-2 backdrop-blur-sm shadow-lg">
                            <Timer className="w-4 h-4 mr-2" />
                            {formatTimeRemaining(timeRemaining)} left
                          </Badge>
                        </motion.div>
                      )}
                      {timeRemaining === null && selectedTimer === null && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                        >
                          <Badge className="bg-green-500/90 text-white text-sm md:text-base px-3 md:px-4 py-2 backdrop-blur-sm shadow-lg">
                            <Sparkles className="w-4 h-4 mr-2" />
                            All day mode
                          </Badge>
                        </motion.div>
                      )}
                      <Badge className="bg-black/50 text-white text-sm md:text-base px-3 md:px-4 py-2 backdrop-blur-sm border-white/30 shadow-lg">
                        {selectedChannel.emoji} {selectedChannel.name}
                      </Badge>
                    </div>
                  </div>

                  {/* Bottom Controls */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex items-center justify-center gap-3 md:gap-4 pointer-events-auto">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        onClick={togglePlayPause}
                        size="lg"
                        className="bg-white/90 hover:bg-white text-black rounded-full w-14 h-14 md:w-16 md:h-16 shadow-2xl"
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6 md:w-8 md:h-8" />
                        ) : (
                          <Play className="w-6 h-6 md:w-8 md:h-8 ml-1" />
                        )}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        onClick={toggleMute}
                        size="lg"
                        className="bg-white/90 hover:bg-white text-black rounded-full w-14 h-14 md:w-16 md:h-16 shadow-2xl"
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5 md:w-6 md:h-6" />
                        ) : (
                          <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
                        )}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        onClick={() => toggleFavorite(selectedChannel.id)}
                        size="lg"
                        className="bg-white/90 hover:bg-white text-black rounded-full w-14 h-14 md:w-16 md:h-16 shadow-2xl"
                      >
                        <Heart className={`w-5 h-5 md:w-6 md:h-6 ${favorites.includes(selectedChannel.id) ? "text-pink-500 fill-pink-500" : ""}`} />
                      </Button>
                    </motion.div>
                  </div>

                  {/* Paused State Instructions */}
                  {!isPlaying && !isLoading && (
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 text-center max-w-md mx-4 shadow-2xl border border-white/10">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Play className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                        </motion.div>
                        <h3 className="text-white text-xl md:text-2xl font-bold mb-4">
                          Ready to entertain your pet?
                        </h3>
                        <p className="text-white/70 mb-6 text-sm md:text-base">
                          Press play and let them enjoy! The controls will hide automatically.
                        </p>
                        <p className="text-white/50 text-xs md:text-sm">
                          Move your mouse to show controls again
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
