'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { href: '/identify',   label: 'Identify',   emoji: '🔍' },
  { href: '/garden',     label: 'My Garden',  emoji: '🌿' },
  { href: '/companions', label: 'Companions', emoji: '🤝' },
  { href: '/today',      label: 'Today',      emoji: '☀️' },
  { href: '/planner',    label: 'Planner',    emoji: '📐' },
  { href: '/rewards',    label: 'Rewards',    emoji: '🏆' },
]

interface Props {
  profile: { display_name: string | null; avatar_url: string | null; usda_zone: string | null; tier: string } | null
  gami:    { xp_total: number; level: number; level_title: string; streak_current: number } | null
}

export default function AppNav({ profile, gami }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [signing, setSigning] = useState(false)
  const xp     = gami?.xp_total ?? 0
  const level  = gami?.level ?? 1
  const nextLvl = Math.pow(level, 2) * 100
  const pct    = Math.min(100, (xp / nextLvl) * 100)

  async function signOut() {
    setSigning(true)
    await supabase.auth.signOut()
    router.push('/')
    toast.success('See you in the garden! 🌱')
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-green-950 border-r border-green-900/50 flex flex-col h-full">
      <div className="p-5 border-b border-green-900/50">
        <Link href="/garden" className="flex items-center gap-3">
          <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={36} height={36} className="rounded-xl animate-bob" />
          <div>
            <div className="font-display text-white font-black text-lg tracking-tight leading-none">SPROUT</div>
            <div className="font-body text-green-600 text-[0.6rem] font-semibold tracking-widest uppercase">ai by Gromitron</div>
          </div>
        </Link>
      </div>
      {profile?.usda_zone && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-green-900/40 border border-green-800/40 rounded-full px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot flex-shrink-0" />
          <span className="text-green-400 text-xs font-body font-semibold truncate">Zone {profile.usda_zone}</span>
          {profile.tier === 'pro' && <span className="ml-auto text-amber-400 text-[0.6rem] font-bold">PRO</span>}
        </div>
      )}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, emoji }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-semibold transition-all duration-150 ${active ? 'bg-green-800/60 text-green-200 border border-green-700/40' : 'text-green-500 hover:text-green-300 hover:bg-green-900/40'}`}>
              <span className="text-base w-6 text-center">{emoji}</span>
              {label}
              {href === '/today' && <span className="ml-auto w-2 h-2 rounded-full bg-terra flex-shrink-0" />}
            </Link>
          )
        })}
      </nav>
      <div className="mx-4 mb-3 bg-green-900/40 border border-green-800/40 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-white font-display font-black text-sm">Lv.{level}</div>
            <div className="text-green-500 font-body text-[0.65rem]">{gami?.level_title ?? 'Seedling'}</div>
          </div>
          <div className="text-right">
            <div className="text-amber-400 font-display font-black text-sm">{xp.toLocaleString()}</div>
            <div className="text-green-600 font-body text-[0.65rem]">XP</div>
          </div>
        </div>
        <div className="h-1.5 bg-green-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        {(gami?.streak_current ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-sm">🔥</span>
            <span className="text-green-400 font-body text-xs font-semibold">{gami!.streak_current} day streak</span>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-green-900/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {profile?.avatar_url
            ? <Image src={profile.avatar_url} alt="" width={32} height={32} className="object-cover" />
            : <span className="text-white text-sm font-bold">{(profile?.display_name ?? 'G')[0].toUpperCase()}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-body font-semibold truncate">{profile?.display_name ?? 'Gardener'}</div>
        </div>
        <button onClick={signOut} disabled={signing} className="text-green-700 hover:text-green-400 transition-colors text-xs" title="Sign out">
          {signing ? '...' : '↩'}
        </button>
      </div>
    </aside>
  )
}
