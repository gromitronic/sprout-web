'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// ─── Exploded Garden Scroll Component ───────────────────────────────
function ExplodedGarden() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0) // 0 → 1

  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const total = containerRef.current.offsetHeight - window.innerHeight
      const scrolled = -rect.top
      setProgress(Math.max(0, Math.min(1, scrolled / total)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Each layer moves by progress * its speed (px)
  const layers = [
    // { id, label, emoji, speed (negative = up, positive = down), color, zIndex }
    { id: 'sky',    label: 'Zone-Aware Weather',    emoji: '☀️', speed: -380, bg: 'from-sky-300 to-blue-200',           z: 7  },
    { id: 'canopy', label: 'AI Plant Identification',emoji: '🔍', speed: -260, bg: 'from-green-600 to-green-700',        z: 6  },
    { id: 'stems',  label: 'Per-Plant AI Chat',      emoji: '💬', speed: -150, bg: 'from-green-700 to-green-800',        z: 5  },
    { id: 'mulch',  label: 'Daily Care Schedule',    emoji: '📋', speed: -50,  bg: 'from-amber-800 to-amber-900',        z: 4  },
    { id: 'soil',   label: 'Companion Planting',     emoji: '🤝', speed:  50,  bg: 'from-yellow-900 to-amber-950',       z: 3  },
    { id: 'roots',  label: 'Garden Planner',         emoji: '📐', speed:  160, bg: 'from-stone-800 to-stone-900',        z: 2  },
    { id: 'earth',  label: 'Season Archive',         emoji: '📚', speed:  280, bg: 'from-stone-950 to-neutral-950',      z: 1  },
  ]

  // Layer heights and vertical positions (centered around 0)
  const layerH = 72  // px each
  const layerW = 680 // max-width px
  const totalH = layers.length * layerH
  const startY  = -totalH / 2

  // Opacity of labels: fade in after 30% scroll
  const labelOpacity = Math.max(0, (progress - 0.25) / 0.4)

  // Sprout mascot emerges at 40% scroll
  const mascotScale = 0.4 + progress * 0.7
  const mascotOpacity = Math.max(0, (progress - 0.3) / 0.4)

  return (
    // Tall scroll container — 500vh gives plenty of scroll room
    <div ref={containerRef} className="relative" style={{ height: '500vh' }}>
      {/* Sticky viewport — stays fixed while user scrolls through container */}
      <div className="sticky top-0 h-screen overflow-hidden bg-green-950 flex flex-col items-center justify-center">

        {/* Section heading */}
        <div
          className="absolute top-8 left-0 right-0 text-center z-20 transition-all duration-300"
          style={{ opacity: 1 - progress * 2 }}
        >
          <p className="text-green-400 text-sm font-body font-semibold tracking-widest uppercase mb-2">
            Everything your garden needs
          </p>
          <h2 className="font-display text-white text-4xl md:text-5xl font-black tracking-tight">
            Layers of intelligence,<br />
            <em className="text-green-400 not-italic">rooted in your zone</em>
          </h2>
          <p className="text-green-500 mt-3 text-base font-body">
            Scroll to explore ↓
          </p>
        </div>

        {/* The exploded layers */}
        <div className="relative flex items-center justify-center" style={{ width: layerW, height: totalH + 200 }}>

          {layers.map((layer, i) => {
            const baseY = startY + i * layerH
            const translateY = baseY + (progress * layer.speed)

            return (
              <div
                key={layer.id}
                className="layer-item absolute left-0 right-0"
                style={{
                  top: '50%',
                  transform: `translateY(calc(-50% + ${translateY}px))`,
                  zIndex: layer.z,
                  height: layerH,
                }}
              >
                {/* Layer band */}
                <div
                  className={`w-full h-full bg-gradient-to-b ${layer.bg} rounded-sm flex items-center px-6 relative overflow-hidden`}
                  style={{
                    boxShadow: progress > 0.1 ? '0 4px 24px rgba(0,0,0,0.4)' : 'none',
                  }}
                >
                  {/* Texture lines suggesting soil strata */}
                  {[...Array(3)].map((_, j) => (
                    <div
                      key={j}
                      className="absolute inset-x-0 border-t border-white/5"
                      style={{ top: `${25 + j * 20}%` }}
                    />
                  ))}

                  {/* Decorative elements per layer */}
                  {layer.id === 'sky' && (
                    <div className="absolute inset-0 overflow-hidden">
                      {['☁️','☁️','☁️'].map((c, j) => (
                        <span key={j} className="absolute text-2xl opacity-40"
                          style={{ left: `${15 + j * 30}%`, top: '20%' }}>{c}</span>
                      ))}
                      <span className="absolute right-8 top-2 text-3xl">☀️</span>
                    </div>
                  )}
                  {layer.id === 'canopy' && (
                    <div className="absolute inset-0 flex items-end px-4 pb-1 gap-2">
                      {['🌿','🌱','🍃','🌿','🌱','🍃','🌿'].map((e, j) => (
                        <span key={j} className="text-xl opacity-60">{e}</span>
                      ))}
                    </div>
                  )}
                  {layer.id === 'stems' && (
                    <div className="absolute inset-0 flex items-center px-8 gap-6 overflow-hidden">
                      {[...Array(8)].map((_, j) => (
                        <div key={j} className="w-1 bg-green-600/40 rounded-full" style={{ height: '60%' }} />
                      ))}
                    </div>
                  )}
                  {layer.id === 'mulch' && (
                    <div className="absolute inset-0 flex items-center px-4 gap-1 overflow-hidden">
                      {[...Array(20)].map((_, j) => (
                        <div key={j} className="rounded-full bg-amber-700/30"
                          style={{ width: 8 + Math.random() * 16, height: 8 + Math.random() * 8 }} />
                      ))}
                    </div>
                  )}
                  {layer.id === 'roots' && (
                    <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 680 72">
                      {[...Array(6)].map((_, j) => (
                        <path key={j} d={`M${80 + j * 100},0 C${70 + j * 100},36 ${110 + j * 100},36 ${100 + j * 100},72`}
                          stroke="#D4A853" fill="none" strokeWidth="2" />
                      ))}
                    </svg>
                  )}
                  {layer.id === 'earth' && (
                    <div className="absolute inset-0 flex items-center px-6 gap-3">
                      {['🪨','🪱','🌰','🪨','🌰','🪱','🪨'].map((e, j) => (
                        <span key={j} className="text-lg opacity-30">{e}</span>
                      ))}
                    </div>
                  )}

                  {/* Layer height label — left side */}
                  <span className="relative z-10 text-white/30 text-xs font-mono font-bold uppercase tracking-widest">
                    {layer.id}
                  </span>
                </div>

                {/* Feature label — floats to the right as layers separate */}
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none"
                  style={{
                    opacity: labelOpacity,
                    transform: `translateY(-50%) translateX(${labelOpacity * 110}%)`,
                    transition: 'none',
                    left: '105%',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="text-sm font-body font-semibold text-green-300">
                    {layer.emoji} {layer.label}
                  </span>
                </div>

                {/* Left label */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none"
                  style={{
                    opacity: labelOpacity,
                    transform: `translateY(-50%) translateX(${-labelOpacity * 110}%)`,
                    transition: 'none',
                    right: '105%',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span className="text-xs font-mono text-green-600 font-bold">
                    0{i + 1}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-green-700 flex-shrink-0" />
                </div>
              </div>
            )
          })}

          {/* Sprout mascot — emerges from the gap between soil layers */}
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, calc(-50% + ${progress * -30}px)) scale(${mascotScale})`,
              opacity: mascotOpacity,
            }}
          >
            <Image
              src="/mascots/sproutthrilled.png"
              alt="Sprout mascot emerging from the garden"
              width={140}
              height={140}
              className="drop-shadow-[0_8px_32px_rgba(90,158,101,0.8)] animate-bob"
              priority
            />
            {/* XP burst */}
            {progress > 0.7 && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-amber-400 text-green-ink text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                🌱 Your garden awaits!
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA — appears at end of scroll */}
        <div
          className="absolute bottom-12 left-0 right-0 flex justify-center"
          style={{ opacity: Math.max(0, (progress - 0.8) / 0.2) }}
        >
          <Link
            href="/login"
            className="bg-green-600 hover:bg-green-500 text-white font-display font-black text-lg px-10 py-4 rounded-full shadow-glow-green transition-all duration-300 hover:-translate-y-1"
          >
            Start Growing Free →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Feature Cards ───────────────────────────────────────────────────
const features = [
  {
    emoji: '📸',
    title: 'Point. Shoot. Identified.',
    desc: 'Snap any plant and our AI identifies it instantly — with zone-specific advice, companion suggestions, and a complete care profile. 97% accuracy.',
    mascot: '/mascots/sproutsearching.png',
    color: 'from-green-900 to-green-800',
  },
  {
    emoji: '💬',
    title: 'Your plant\'s own AI.',
    desc: 'Every plant gets its own conversation with Sprout. Ask anything, attach a photo, get a real answer — not a generic tip sheet.',
    mascot: '/mascots/sproutsmiling.png',
    color: 'from-sky-900 to-sky-800',
  },
  {
    emoji: '🤝',
    title: 'Plants that work together.',
    desc: 'Basil loves tomatoes. Fennel ruins them. The companion planting engine maps what grows together and what fights — all tuned to your zone.',
    mascot: '/mascots/sproutdigging.png',
    color: 'from-earth to-amber-900',
  },
  {
    emoji: '📐',
    title: 'Plan it. Build it. Grow it.',
    desc: 'Design your garden layout with AI, then get a complete parts list and step-by-step instructions for raised beds, trellises, and more.',
    mascot: '/mascots/sproutwatering.png',
    color: 'from-green-800 to-green-900',
  },
]

// ─── Pricing Section ─────────────────────────────────────────────────
const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: 'border-green-700',
    features: ['3 plants', '10 AI messages/month', '5 scans/month', 'Basic companion data'],
    cta: 'Start Free',
    href: '/login',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$4.99',
    period: '/month',
    annualNote: '$39.99/yr — save 33%',
    color: 'border-green-500 shadow-glow-green',
    features: ['Unlimited plants', 'Unlimited AI chat', 'Full Garden Planner', 'Season Archive', 'Structure Builder + parts lists', 'No ads'],
    cta: 'Start Pro Free',
    href: '/login?plan=pro',
    highlight: true,
  },
  {
    name: 'Family',
    price: '$12.99',
    period: '/month',
    annualNote: '$99.99/yr — save 36%',
    color: 'border-amber-600',
    features: ['6 family members', 'All Pro features', 'Shared family garden', 'Kids\' mode'],
    cta: 'Start Family Free',
    href: '/login?plan=family',
    highlight: false,
  },
]

// ─── Main Landing Page ───────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-cream">

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-green-950/90 backdrop-blur-md border-b border-green-900/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/mascots/sproutbase.png" alt="Sprout" width={36} height={36}
              className="rounded-xl animate-bob" />
            <span className="font-display text-white font-black text-xl tracking-tight">
              SPROUT
              <sub className="font-body text-green-500 text-[0.45rem] font-semibold tracking-widest uppercase block -mt-1 not-italic">
                ai by Gromitron
              </sub>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-body font-semibold text-green-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="https://gromitron.com" className="hover:text-white transition-colors">Gromitron</a>
          </div>
          <Link
            href="/login"
            className="bg-green-600 hover:bg-green-500 text-white font-body font-bold text-sm px-5 py-2.5 rounded-full transition-all duration-200 hover:-translate-y-px"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen bg-hero-gradient flex flex-col items-center justify-center text-center px-6 pt-24 overflow-hidden grain-overlay">
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-700/10 blur-3xl pointer-events-none" />

        {/* Floating sparkles */}
        {['✦','✦','✦','✦'].map((s, i) => (
          <span key={i} className="absolute text-amber-400/40 text-sm animate-bob pointer-events-none"
            style={{
              top:  `${20 + i * 18}%`,
              left: i % 2 === 0 ? `${8 + i * 5}%` : `${75 + i * 4}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${3 + i}s`,
            }}>
            {s}
          </span>
        ))}

        <div className="relative z-10 flex flex-col items-center max-w-4xl">
          {/* Mascot */}
          <div className="mb-6">
            <Image
              src="/mascots/sproutthrilled.png"
              alt="Sprout — your AI garden companion"
              width={160}
              height={160}
              className="drop-shadow-[0_16px_48px_rgba(61,112,72,0.6)] animate-bob"
              priority
            />
          </div>

          {/* Badge */}
          <div className="flex items-center gap-2 bg-green-800/40 border border-green-600/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
            <span className="text-green-400 text-xs font-body font-bold tracking-widest uppercase">
              Now in Beta · Free to Start
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-black text-white leading-[1.02] tracking-tight mb-6">
            Your garden,<br />
            <em className="text-green-400 not-italic">powered by AI.</em>
          </h1>

          <p className="text-green-400/80 text-xl md:text-2xl font-body font-light max-w-2xl leading-relaxed mb-10">
            SPROUT turns any gardener into a plant expert — with AI that actually knows your soil, your zone, and your schedule.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/login"
              className="bg-green-600 hover:bg-green-500 text-white font-display font-black text-xl px-10 py-5 rounded-full shadow-sprout-xl shadow-green-900/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-green"
            >
              Start Growing Free 🌱
            </Link>
            <a
              href="#features"
              className="border border-green-600/40 hover:border-green-500 text-green-400 hover:text-green-300 font-body font-semibold text-lg px-8 py-5 rounded-full transition-all duration-200"
            >
              See how it works →
            </a>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-green-600 text-sm font-body">
            Available on iPhone · iPad · Mac · Web &nbsp;·&nbsp; Free tier, no credit card required
          </p>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-green-600 animate-bounce">
          <span className="text-xs font-body font-semibold tracking-widest uppercase">Explore</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <path d="M8 0v20M1 14l7 8 7-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ── EXPLODED GARDEN SCROLL SECTION ──────────────────────── */}
      <ExplodedGarden />

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section id="features" className="py-32 px-6 bg-cream">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-green-700 text-sm font-body font-bold tracking-widest uppercase mb-4">
              Everything in the app
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-black text-green-ink tracking-tight">
              Designed for how<br />gardeners actually garden
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className={`relative rounded-3xl bg-gradient-to-br ${f.color} p-8 overflow-hidden group hover:-translate-y-1 transition-all duration-300 cursor-default`}
              >
                {/* Grain overlay */}
                <div className="absolute inset-0 bg-grain opacity-50 rounded-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                  <span className="text-3xl mb-4">{f.emoji}</span>
                  <h3 className="font-display text-white text-2xl font-black mb-3 tracking-tight">
                    {f.title}
                  </h3>
                  <p className="text-white/60 font-body text-base leading-relaxed flex-1">
                    {f.desc}
                  </p>

                  {/* Mascot in corner */}
                  <div className="absolute -bottom-4 -right-4 opacity-30 group-hover:opacity-50 transition-opacity duration-300">
                    <Image src={f.mascot} alt="" width={120} height={120}
                      className="drop-shadow-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section className="py-32 px-6 bg-green-950">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-green-500 text-sm font-body font-bold tracking-widest uppercase mb-4">
            Your first 60 seconds with SPROUT
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-black text-white tracking-tight mb-16">
            Up and growing in under a minute
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Set your zone',
                desc: 'Tell us where your garden is (not where you live — they can be different). We detect your USDA zone automatically.',
                mascot: '/mascots/sproutbase.png',
              },
              {
                step: '02',
                title: 'Scan a plant',
                desc: 'Point your camera. SPROUT identifies the plant, assesses your zone fit, and suggests the perfect companion plants.',
                mascot: '/mascots/sproutsearching.png',
              },
              {
                step: '03',
                title: 'Start the conversation',
                desc: 'Every plant gets its own AI chat. Ask anything — watering, pests, harvest timing. Sprout knows this plant, in your zone, today.',
                mascot: '/mascots/sproutsmiling.png',
              },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <Image src={s.mascot} alt={s.title} width={100} height={100}
                    className="drop-shadow-[0_8px_24px_rgba(90,158,101,0.4)]" />
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-green-ink text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-display text-white text-xl font-black mb-3">{s.title}</h3>
                <p className="text-green-500 font-body text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAMIFICATION CALLOUT ─────────────────────────────────── */}
      <section className="py-24 px-6 bg-cream">
        <div className="max-w-5xl mx-auto">
          <div className="bg-green-900 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-10 overflow-hidden relative grain-overlay">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-700/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex-shrink-0">
              <Image
                src="/mascots/sproutthrilled.png"
                alt="Sprout thrilled with your garden progress"
                width={160}
                height={160}
                className="drop-shadow-[0_8px_32px_rgba(90,158,101,0.5)] animate-bob"
              />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🔥</span>
                <span className="text-amber-400 font-body font-bold text-sm tracking-widest uppercase">
                  Gamified for real gardeners
                </span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                Garden streaks. XP. Badges.<br />
                <em className="text-green-400 not-italic">Real accomplishments.</em>
              </h2>
              <p className="text-green-400/80 font-body leading-relaxed mb-6">
                Earn XP for every scan, chat, and harvest. Level up from Seedling to Legendary Gardener. Unlock badges tied to real milestones — not participation trophies.
              </p>
              <div className="flex flex-wrap gap-3">
                {['🌱 First Sprout', '🔥 14-Day Streak', '🍅 First Harvest', '🤝 Guild Master', '📐 Master Planner'].map(b => (
                  <span key={b} className="bg-green-800/60 border border-green-700/40 text-green-300 text-xs font-body font-semibold px-3 py-1.5 rounded-full">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────── */}
      <section id="pricing" className="py-32 px-6 bg-green-950">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-green-500 text-sm font-body font-bold tracking-widest uppercase mb-4">
            Simple, honest pricing
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Start free. Grow as you go.
          </h2>
          <p className="text-green-500 font-body mb-16">
            No credit card required. Upgrade or downgrade anytime.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`relative bg-green-900/40 border-2 ${t.color} rounded-2xl p-8 flex flex-col ${t.highlight ? 'scale-105' : ''}`}
              >
                {t.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-display text-white text-2xl font-black mb-1">{t.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-black text-white">{t.price}</span>
                    <span className="text-green-500 font-body text-sm">{t.period}</span>
                  </div>
                  {t.annualNote && (
                    <p className="text-amber-400 text-xs font-body mt-1">{t.annualNote}</p>
                  )}
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {t.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-left">
                      <span className="text-green-400 text-sm">✓</span>
                      <span className="text-green-300 font-body text-sm">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={t.href}
                  className={`w-full py-3.5 rounded-xl font-body font-bold text-sm transition-all duration-200 text-center block
                    ${t.highlight
                      ? 'bg-green-500 hover:bg-green-400 text-white shadow-glow-green'
                      : 'bg-green-800/60 hover:bg-green-800 text-green-200 border border-green-700/40'
                    }`}
                >
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="py-32 px-6 bg-cream text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-green-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <Image
            src="/mascots/sproutwatering.png"
            alt="Sprout watering plants"
            width={140}
            height={140}
            className="mx-auto mb-8 drop-shadow-xl animate-bob"
          />
          <h2 className="font-display text-5xl md:text-6xl font-black text-green-ink tracking-tight mb-6">
            Ready to grow<br />
            <em className="text-green-700 not-italic">something great?</em>
          </h2>
          <p className="text-green-700 font-body text-xl mb-10 leading-relaxed">
            Join the beta. Free forever for your first 3 plants.<br />No credit card. No catch. Just better gardening.
          </p>
          <Link
            href="/login"
            className="inline-block bg-green-800 hover:bg-green-700 text-white font-display font-black text-2xl px-14 py-6 rounded-full shadow-sprout-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-glow-green"
          >
            Plant your first seed 🌱
          </Link>
          <p className="mt-6 text-green-500 text-sm font-body">
            Available on iPhone · iPad · Mac · Web
          </p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="bg-green-950 py-12 px-6 text-center border-t border-green-900/50">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={28} height={28} className="opacity-60" />
          <span className="font-display text-green-600 font-black tracking-tight">
            SPROUT <span className="font-body font-normal text-xs">by Gromitron</span>
          </span>
        </div>
        <p className="text-green-700 text-sm font-body">
          Grow smarter. Grow anywhere. &nbsp;·&nbsp;
          <a href="https://gromitron.com" className="hover:text-green-500 transition-colors">gromitron.com</a>
        </p>
        <p className="text-green-800 text-xs font-body mt-3">
          © 2026 Gromitron. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
