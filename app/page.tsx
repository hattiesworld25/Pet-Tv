"use client"

// Pet TV v3 — Hattie asked 2026-11-17: shorter, precise, animated, very entertaining.
// Same app, same channels and features as v2 (filters, Favorites saved in the
// browser, Auto-Stop Timer, real YouTube play/pause/mute), in about a third of
// the code: one data list, one floating-emoji component, map-driven buttons.
// v2's deployed page is saved next door as pet-tv-app-page-v2-deployed.tsx.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Dices, Heart, Pause, Play, SkipForward, Sparkles, Timer, Volume2, VolumeX } from "lucide-react"

type Pet = "cat" | "dog" | "both"
type Channel = { id: string; name: string; emoji: string; desc: string; fun: string; yt: string; pet: Pet; grad: string }

const CHANNELS: Channel[] = [
  { id: "birds",     name: "Bird Watching", emoji: "🐦", desc: "Backyard birds chirping and flying", fun: "Chase the flutter!", yt: "xbs7FT7dXYc", pet: "cat",  grad: "from-sky-400 to-blue-500" },
  { id: "fish",      name: "Aquarium",      emoji: "🐠", desc: "Colorful fish swimming peacefully",  fun: "Hypnotic swirls",   yt: "oy5dJkKbIlg", pet: "cat",  grad: "from-cyan-400 to-teal-500" },
  { id: "squirrels", name: "Squirrel TV",   emoji: "🐿️", desc: "Squirrels playing in the garden",    fun: "Nutty zoomies!",    yt: "gvPXHxWLuxk", pet: "dog",  grad: "from-amber-400 to-orange-500" },
  { id: "mice",      name: "Mouse Hunt",    emoji: "🐭", desc: "Little critters scurrying around",   fun: "Pounce practice",   yt: "J_gPJRjS_-I", pet: "cat",  grad: "from-gray-400 to-slate-500" },
  { id: "nature",    name: "Nature Sounds", emoji: "🌳", desc: "Relaxing forest ambience",           fun: "Forest daydreams",  yt: "d1XNAbbJRFc", pet: "both", grad: "from-green-400 to-emerald-500" },
  { id: "beach",     name: "Beach Waves",   emoji: "🌊", desc: "Calming ocean sounds",               fun: "Splash & snooze",   yt: "bn9F19Hi1Lk", pet: "both", grad: "from-blue-400 to-indigo-500" },
  { id: "laser",     name: "Laser Pointer", emoji: "🔴", desc: "Moving red dot for cats to chase",   fun: "Catch that dot!",   yt: "z3U0udLH974", pet: "cat",  grad: "from-red-400 to-rose-500" },
  { id: "fireplace", name: "Cozy Fireplace",emoji: "🔥", desc: "Warm crackling fireplace",           fun: "Warm & cozy",       yt: "L_LUpnjgPso", pet: "both", grad: "from-orange-400 to-red-500" },
]

const TIMERS: { label: string; min: number | null }[] = [
  { label: "15 min", min: 15 }, { label: "30 min", min: 30 }, { label: "1 hour", min: 60 },
  { label: "2 hours", min: 120 }, { label: "4 hours", min: 240 }, { label: "All day", min: null },
]
const FILTERS: { key: "all" | Pet; label: string }[] = [
  { key: "all", label: "🐾 All Pets" }, { key: "cat", label: "🐱 Cats" }, { key: "dog", label: "🐶 Dogs" },
]
const PET_BADGE: Record<Pet, string> = { cat: "🐱 Cat", dog: "🐶 Dog", both: "🐾 Both" }
const FLOATERS = ["🐾", "🧶", "🍃", "🫧", "🐟", "🦴", "🐾", "🧶", "🍃", "🫧", "⭐", "🐾"]
const embed = (yt: string) => `https://www.youtube.com/embed/${yt}?autoplay=1&mute=0&controls=0&enablejsapi=1&loop=1&playlist=${yt}`
const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}` : `${m}m`)

/** One floating background emoji — replaces v2's four separate float components. */
function Floater({ emoji, i }: { emoji: string; i: number }) {
  const left = `${(i * 83) % 96}%`
  const size = 22 + ((i * 13) % 26)
  return (
    <motion.span className="absolute select-none" style={{ left, bottom: "-8%", fontSize: size }}
      animate={{ y: [0, -1100], x: [0, i % 2 ? 60 : -60], rotate: [0, i % 2 ? 300 : -300], opacity: [0, 0.5, 0.5, 0] }}
      transition={{ duration: 16 + (i % 5) * 3, delay: i * 1.7, repeat: Infinity, ease: "linear" }}>
      {emoji}
    </motion.span>
  )
}

/** Emoji burst — pops when a show starts or a favorite is tapped. */
function Burst({ burst }: { burst: { key: number; emoji: string } | null }) {
  if (!burst) return null
  return (
    <div key={burst.key} className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <motion.span key={i} className="absolute text-3xl"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{ x: Math.cos(a) * 170, y: Math.sin(a) * 170, opacity: 0, scale: 1.4, rotate: 260 }}
            transition={{ duration: 0.9, ease: "easeOut" }}>
            {i % 3 ? burst.emoji : "✨"}
          </motion.span>
        )
      })}
    </div>
  )
}

const pill = (on: boolean) =>
  `px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
    on ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow-lg scale-105"
       : "bg-white/5 text-purple-200 border-white/20 hover:bg-white/15"}`

export default function Home() {
  const [channel, setChannel] = useState<Channel | null>(null) // null = home grid
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [filter, setFilter] = useState<"all" | Pet>("all")
  const [timerMin, setTimerMin] = useState<number | null>(null)
  const [left, setLeft] = useState<number | null>(null) // minutes remaining
  const [controls, setControls] = useState(true)
  const [loading, setLoading] = useState(false)
  const [favOnly, setFavOnly] = useState(false)
  const [favs, setFavs] = useState<string[]>([])
  const [burst, setBurst] = useState<{ key: number; emoji: string } | null>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const favReady = useRef(false)

  const yt = useCallback((func: "playVideo" | "pauseVideo" | "mute" | "unMute") =>
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "https://www.youtube.com"), [])
  const pop = useCallback((emoji: string) => setBurst({ key: Date.now(), emoji }), [])

  // Favorites: load once after mount (same localStorage key as v2, so saved hearts carry over), then keep saved.
  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem("pet-tv-favorites") || "[]"); if (Array.isArray(s)) setFavs(s) } catch {}
    favReady.current = true
  }, [])
  useEffect(() => { if (favReady.current) try { localStorage.setItem("pet-tv-favorites", JSON.stringify(favs)) } catch {} }, [favs])
  const toggleFav = (c: Channel) => { setFavs(f => f.includes(c.id) ? f.filter(x => x !== c.id) : [...f, c.id]); pop("❤️") }

  const list = useMemo(() => CHANNELS.filter(c =>
    (!favOnly || favs.includes(c.id)) && (filter === "all" || c.pet === filter || c.pet === "both")), [filter, favOnly, favs])

  const open = useCallback((c: Channel) => {
    setChannel(c); setPlaying(true); setMuted(false); setControls(true); setLoading(true)
    setLeft(timerMin); pop(c.emoji)
  }, [timerMin, pop])
  const goHome = useCallback(() => { yt("pauseVideo"); setChannel(null); setPlaying(false); setLeft(null) }, [yt])
  const surf = useCallback((pick?: Channel) => {
    const pool = list.length ? list : CHANNELS
    open(pick ?? pool[Math.floor(Math.random() * pool.length)])
  }, [list, open])
  const next = () => { const i = list.findIndex(c => c.id === channel?.id); surf(list[(i + 1) % list.length] ?? CHANNELS[0]) }

  // Auto-stop countdown: tick once a minute while a show is playing; at zero, head home.
  useEffect(() => {
    if (!channel || !playing || left === null) return
    if (left <= 0) { goHome(); return }
    const t = setTimeout(() => setLeft(l => (l === null ? null : l - 1)), 60000)
    return () => clearTimeout(t)
  }, [channel, playing, left, goHome])

  // Player controls fade after 3 quiet seconds while playing.
  useEffect(() => {
    if (!channel || !playing || !controls) return
    const t = setTimeout(() => setControls(false), 3000)
    return () => clearTimeout(t)
  }, [channel, playing, controls])

  /* ---------------- Player ---------------- */
  if (channel) return (
    <div className="fixed inset-0 bg-black" onClick={() => setControls(c => !c)}>
      <Burst burst={burst} />
      {loading && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-gradient-to-br from-purple-900 to-blue-900">
          <div className="text-center">
            <motion.div className="text-7xl" animate={{ rotate: 360, scale: [1, 1.25, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>🐾</motion.div>
            <p className="text-white text-xl font-bold mt-4">Loading {channel.name}…</p>
            <p className="text-purple-300 text-sm">Get your pet ready! {channel.emoji}</p>
          </div>
        </div>
      )}
      <iframe ref={frame} src={embed(channel.yt)} title={channel.name} allow="autoplay; encrypted-media" allowFullScreen
        className="w-full h-full" onLoad={() => setLoading(false)} />
      <AnimatePresence>
        {controls && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70" onClick={() => setControls(false)}>
            <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between gap-2">
              <button onClick={e => { e.stopPropagation(); goHome() }} className="px-4 py-2 rounded-xl bg-black/60 text-white border border-white/30 backdrop-blur hover:bg-black/80 flex items-center"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
              <div className="flex gap-2">
                <span className="px-3 py-2 rounded-xl bg-purple-500/90 text-white text-sm font-semibold">{left !== null ? `⏰ ${fmt(left)} left` : "🌞 All day"}</span>
                <span className="px-3 py-2 rounded-xl bg-black/60 text-white text-sm border border-white/30">{channel.emoji} {channel.name}</span>
              </div>
            </div>
            {!playing && !loading && (
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="text-8xl drop-shadow-2xl">▶️</motion.div>
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 p-5 flex justify-center gap-3">
              {[
                { label: playing ? "Pause" : "Play", icon: playing ? <Pause /> : <Play />, fn: () => { setPlaying(p => !p); yt(playing ? "pauseVideo" : "playVideo") } },
                { label: muted ? "Unmute" : "Mute", icon: muted ? <VolumeX /> : <Volume2 />, fn: () => { setMuted(m => !m); yt(muted ? "unMute" : "mute") } },
                { label: "Favorite", icon: <Heart className={favs.includes(channel.id) ? "fill-pink-500 text-pink-500" : ""} />, fn: () => toggleFav(channel) },
                { label: "Next show", icon: <SkipForward />, fn: next },
              ].map(b => (
                <motion.button key={b.label} aria-label={b.label} title={b.label} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                  onClick={e => { e.stopPropagation(); b.fn() }} className="w-14 h-14 grid place-items-center rounded-full bg-white/90 text-black shadow-2xl [&>svg]:w-6 [&>svg]:h-6">
                  {b.icon}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  /* ---------------- Home ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">{FLOATERS.map((e, i) => <Floater key={i} emoji={e} i={i} />)}</div>
      <Burst burst={burst} />
      <main className="relative z-10 max-w-7xl mx-auto p-4 md:p-10">
        <header className="text-center mb-8">
          <motion.div className="text-7xl md:text-8xl" animate={{ y: [0, -10, 0], rotate: [0, -4, 4, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>📺</motion.div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">Pet TV</h1>
          <p className="text-purple-200 text-xl mt-2">Entertainment for your furry friends 🐾</p>
          <p className="text-purple-300/70 italic text-sm flex items-center justify-center gap-1 mt-1"><Sparkles className="w-4 h-4" /> Keep them entertained while you&apos;re away</p>
        </header>

        <section className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 md:p-5 mb-8 flex flex-col lg:flex-row gap-5 shadow-2xl">
          <div className="flex-1">
            <p className="text-purple-200 text-sm font-semibold mb-2">Pet Type</p>
            <div className="flex gap-2 flex-wrap">{FILTERS.map(f => <button key={f.key} className={pill(filter === f.key)} onClick={() => setFilter(f.key)}>{f.label}</button>)}</div>
          </div>
          <div className="flex-1">
            <p className="text-purple-200 text-sm font-semibold mb-2 flex items-center gap-1"><Timer className="w-4 h-4" /> Auto-Stop Timer</p>
            <div className="flex gap-2 flex-wrap">{TIMERS.map(t => <button key={t.label} className={pill(timerMin === t.min)} onClick={() => setTimerMin(t.min)}>{t.label}</button>)}</div>
          </div>
          <div className="flex items-end">
            <motion.button whileHover={{ scale: 1.06, rotate: -2 }} whileTap={{ scale: 0.94 }} onClick={() => surf()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-white font-black shadow-xl flex items-center gap-2">
              <Dices className="w-5 h-5" /> Surprise Me!
            </motion.button>
          </div>
        </section>

        <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
          <h2 className="text-2xl md:text-3xl font-bold text-white">📺 Channels</h2>
          <div className="flex items-center gap-2">
            <button className={pill(favOnly)} onClick={() => setFavOnly(v => !v)}><Heart className={`inline w-4 h-4 mr-1 -mt-0.5 ${favOnly ? "fill-current" : ""}`} />Favorites ({favs.length})</button>
            <span className="px-3 py-2 rounded-xl bg-purple-500/30 text-purple-100 text-sm border border-purple-400/30">{list.length} channels</span>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-6xl mb-3">💔</div>
            <p className="text-white text-xl font-semibold">{favOnly && !favs.length ? "No favorites yet" : "No channels found"}</p>
            <p className="text-purple-200/70 mt-1">{favOnly && !favs.length ? "Tap the heart on any channel to save it here." : "Try a different pet type."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {list.map((c, i) => (
              <motion.article key={c.id} initial={{ opacity: 0, y: 24, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 220, damping: 19 }}
                whileHover={{ scale: 1.05, y: -6, rotate: i % 2 ? 1 : -1 }} whileTap={{ scale: 0.95 }}
                onClick={() => open(c)} className="cursor-pointer rounded-2xl overflow-hidden bg-white/10 backdrop-blur border border-white/20 shadow-xl">
                <div className={`h-36 bg-gradient-to-br ${c.grad} relative grid place-items-center overflow-hidden`}>
                  <motion.span className="text-6xl drop-shadow-lg" animate={{ y: [0, -8, 0], rotate: [0, 8, -8, 0] }} transition={{ duration: 2 + (i % 3) * 0.5, repeat: Infinity }}>{c.emoji}</motion.span>
                  <span className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-black/45 text-white text-xs font-bold">{c.fun}</span>
                  <button aria-label="Toggle favorite" onClick={e => { e.stopPropagation(); toggleFav(c) }}
                    className="absolute top-2 right-2 w-9 h-9 grid place-items-center rounded-full bg-black/50 hover:bg-black/75">
                    <Heart className={`w-5 h-5 ${favs.includes(c.id) ? "fill-pink-500 text-pink-500" : "text-white"}`} />
                  </button>
                  <span className="absolute inset-0 grid place-items-center bg-black/0 hover:bg-black/25 transition-colors text-white text-5xl opacity-0 hover:opacity-100">▶️</span>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-bold text-lg leading-tight">{c.name}</h3>
                  <p className="text-purple-200/70 text-sm mt-0.5">{c.desc}</p>
                  <span className="inline-block mt-3 px-2 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-100 text-xs">{PET_BADGE[c.pet]}</span>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        <div className="mt-10 overflow-hidden rounded-full bg-black/25 border border-white/10 py-2" aria-hidden>
          <div className="animate-[marquee_22s_linear_infinite] whitespace-nowrap text-purple-200/80 text-sm font-semibold">
            {`🐾 Now showing: ${CHANNELS.map(c => `${c.emoji} ${c.name}`).join("  •  ")}  •  `.repeat(2)}
          </div>
        </div>
        <p className="text-center text-purple-300/60 text-xs mt-4">💡 Tip: Put the screen where your pet can watch comfy.</p>
      </main>
    </div>
  )
}
