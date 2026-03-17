'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const NAV = [
  { href: '/identify',   icon: '🔍', label: 'Identify'   },
  { href: '/garden',     icon: '🌿', label: 'Garden'     },
  { href: '/companions', icon: '🤝', label: 'Companions' },
  { href: '/chat',       icon: '💬', label: 'Chat'       },
  { href: '/today',      icon: '☀️', label: 'Today'      },
  { href: '/planner',    icon: '📐', label: 'Planner'    },
  { href: '/rewards',    icon: '🏆', label: 'Rewards'    },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const [user,    setUser]    = useState<User | null>(null)
  const [profile, setProfile] = useState<{ display_name: string; usda_zone: string } | null>(null)
  const [xp,      setXp]      = useState(0)
  const [level,   setLevel]   = useState(1)
  const [streak,  setStreak]  = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user)
      supabase
        .from('user_dashboard')
        .select('display_name, usda_zone, xp_total, level, streak_current')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile(data)
            setXp(data.xp_total ?? 0)
            setLevel(data.level ?? 1)
            setStreak(data.streak_current ?? 0)
          }
        })
    })
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const xpToNext   = level * level * 100
  const xpProgress = Math.min(100, (xp / xpToNext) * 100)

  return (
    <div className="flex h-screen bg-cream overflow-hidden">

      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-56 bg-green-950 border-r border-green-900/50 flex-shrink-0">
        <div className="px-4 py-4 border-b border-green-900/50">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={32} height={32} className="rounded-lg group-hover:animate-bob" />
            <div>
              <span className="font-display text-white font-black text-lg tracking-tight leading-none block">SPROUT</span>
              <span className="font-body text-green-600 text-[10px] font-semibold tracking-widest uppercase">by Gromitron</span>
            </div>
          </Link>
        </div>

        {profile?.usda_zone && (
          <div className="mx-3 mt-3 px-3 py-2 bg-green-900/40 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot flex-shrink-0" />
            <span className="text-green-400 text-xs font-body font-semibold truncate">Zone {profile.usda_zone}</span>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-semibold transition-all duration-150
                  ${active ? 'bg-green-800/60 text-green-300 border border-green-700/40' : 'text-green-600 hover:text-green-300 hover:bg-green-900/60'}`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pb-3 border-t border-green-900/50 pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-amber-400 text-xs font-body font-bold">⚡ Level {level}</span>
            <span className="text-green-600 text-xs font-body">{xp.toLocaleString()} XP</span>
          </div>
          <div className="h-1.5 bg-green-900 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-700" style={{ width: `${xpProgress}%` }} />
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm">🔥</span>
              <span className="text-orange-400 text-xs font-body font-semibold">{streak} day streak</span>
            </div>
          )}
        </div>

        <div className="px-3 pb-4">
          <button onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-green-700 hover:text-green-400 hover:bg-green-900/40 text-xs font-body font-semibold transition-colors">
            <span>👋</span>
            <span className="truncate">{profile?.display_name ?? user?.email ?? 'Gardener'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-green-950 border-b border-green-900/50 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={28} height={28} className="rounded-lg" />
            <span className="font-display text-white font-black text-lg tracking-tight">SPROUT</span>
          </Link>
          <div className="flex items-center gap-3">
            {streak > 0 && <span className="text-orange-400 text-sm font-body font-bold">🔥 {streak}</span>}
            <span className="text-amber-400 text-sm font-body font-bold">⚡ {xp.toLocaleString()}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>

        <nav className="md:hidden flex items-center bg-green-950 border-t border-green-900/50 flex-shrink-0">
          {NAV.map(({ href, icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-body font-semibold transition-colors ${active ? 'text-green-400' : 'text-green-700'}`}>
                <span className="text-lg leading-none">{icon}</span>
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
