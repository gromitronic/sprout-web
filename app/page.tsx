'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// ─── Feature Cards ───────────────────────────────────────────────────
const features = [
  {
    emoji: '📸',
    title: 'Identify Anything',
    desc: 'Snap a photo of any plant, animal symptom, or fish disease. AI identifies it instantly with zone-specific advice, treatment plans, and care schedules.',
    mascot: '/mascots/sproutsearching.png',
    color: 'from-green-900 to-green-800',
  },
  {
    emoji: '🔄',
    title: 'Ecosystem Cycles',
    desc: 'Your chickens fertilize your garden. Your fish water feeds your plants. Your bees double your yields. SPROUT maps every connection and tells you how to close the loop.',
    mascot: '/mascots/sproutthrilled.png',
    color: 'from-sky-900 to-sky-800',
  },
  {
    emoji: '🐾',
    title: 'Whole Farm Care',
    desc: 'Daily schedules for plants AND animals. Egg logs, milk tracking, harvest records, fish water quality checks — one AI companion for your whole homestead.',
    mascot: '/mascots/sproutdigging.png',
    color: 'from-earth to-amber-900',
  },
  {
    emoji: '📐',
    title: 'Build it Right',
    desc: 'Need a hawk-proof chicken coop? A raised bed? An aquaponics system? Get a full blueprint with materials list, predator safety features, and step-by-step build instructions.',
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
              Plants · Animals · Fish · All Connected
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-black text-white leading-[1.02] tracking-tight mb-6">
            Your whole farm,<br />
            <em className="text-green-400 not-italic">powered by AI.</em>
          </h1>

          <p className="text-green-400/80 text-xl md:text-2xl font-body font-light max-w-2xl leading-relaxed mb-10">
            SPROUT is your whole farm AI — plants, animals, and fish, all connected. Zone-smart advice, ecosystem cycle planning, and an AI that knows when your duck pond can fertilize your raised beds.
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
            🌱 Plants · 🐓 Animals · 🐟 Fish · All in one ecosystem &nbsp;·&nbsp; Free tier, no credit card required
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

      {/* ── DIVIDER ───────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-green-950">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-green-500 text-sm font-body font-bold tracking-widest uppercase mb-6">
            Everything your farm needs
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-4xl">
            {['🌱','🥕','🍅','🌿','🐓','🦆','🐐','🐇','🐝','🐟','🪴','📐'].map((e, i) => (
              <span key={i} className="opacity-70 hover:opacity-100 transition-opacity hover:scale-125 transform duration-200 cursor-default">
                {e}
              </span>
            ))}
          </div>
          <p className="text-green-700 font-body text-sm mt-6">
            Plants · Animals · Fish · All connected in one ecosystem
          </p>
        </div>
      </section>

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
                title: 'Tell us about your space',
                desc: 'Your zone, garden size, and goals — food, animals, fish, or all three. We build your personalized farm profile in under 60 seconds.',
                mascot: '/mascots/sproutbase.png',
              },
              {
                step: '02',
                title: 'Add your plants and animals',
                desc: 'Scan plants, log your flock, add your pond. SPROUT tracks everything and starts connecting the dots between each part of your farm.',
                mascot: '/mascots/sproutsearching.png',
              },
              {
                step: '03',
                title: 'Let the ecosystem work',
                desc: 'Sprout shows how each piece supports the others — cutting costs, closing loops, and building a self-sustaining homestead you can be proud of.',
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
                {['🌱 First Sprout', '🔥 14-Day Streak', '🍅 First Harvest', '🤝 Guild Master', '📐 Master Planner', '🐟 Aquaponics Pro', '🔄 Full Ecosystem', '♻️ Zero Waste Farm'].map(b => (
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
            Ready to build<br />
            <em className="text-green-700 not-italic">your whole farm?</em>
          </h2>
          <p className="text-green-700 font-body text-xl mb-10 leading-relaxed">
            Add your plants, animals, and fish. Let Sprout show you how they all work together — for free.
          </p>
          <Link
            href="/login"
            className="inline-block bg-green-800 hover:bg-green-700 text-white font-display font-black text-2xl px-14 py-6 rounded-full shadow-sprout-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-glow-green"
          >
            Plant your first seed 🌱
          </Link>
          <p className="mt-6 text-green-500 text-sm font-body">
            🌱 Plants · 🐓 Animals · 🐟 Fish · All in one ecosystem
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
          From a backyard garden to a full homestead — Sprout knows it all. &nbsp;·&nbsp;
          <a href="https://gromitron.com" className="hover:text-green-500 transition-colors">gromitron.com</a>
        </p>
        <p className="text-green-800 text-xs font-body mt-3">
          © 2026 Gromitron. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
