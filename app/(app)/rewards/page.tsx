'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type Badge = { id: string; name: string; description: string; emoji: string; xp_reward: number; category: string; earned?: boolean; earned_at?: string }
type Gamification = { xp_total: number; level: number; level_title: string; streak_current: number; streak_best: number; total_plants: number; total_harvests: number; total_scans: number; total_chats: number }

const LEVEL_TITLES = ['Seedling','Sprout','Gardener','Green Thumb','Plant Whisperer','Herb Master','Zone Expert','Garden Sage','Master Grower','Legendary Gardener']

export default function RewardsPage() {
  const supabase = createClient()
  const [gami,    setGami]    = useState<Gamification | null>(null)
  const [badges,  setBadges]  = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: dashData }, { data: allBadges }, { data: earnedBadges }] = await Promise.all([
        supabase.from('sprout_gamification').select('*').eq('user_id', user.id).single(),
        supabase.from('sprout_badge_definitions').select('*').order('xp_reward'),
        supabase.from('sprout_user_badges').select('badge_id, earned_at').eq('user_id', user.id),
      ])

      setGami(dashData)
      const earnedIds = new Set((earnedBadges ?? []).map((b: any) => b.badge_id))
      const earnedMap = Object.fromEntries((earnedBadges ?? []).map((b: any) => [b.badge_id, b.earned_at]))
      setBadges((allBadges ?? []).map((b: any) => ({ ...b, earned: earnedIds.has(b.id), earned_at: earnedMap[b.id] })))
      setLoading(false)
    }
    load()
  }, [])

  const xpToNext   = gami ? gami.level * gami.level * 100 : 100
  const xpProgress = gami ? Math.min(100, (gami.xp_total / xpToNext) * 100) : 0
  const earnedCount = badges.filter(b => b.earned).length

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-green-ink text-3xl font-black tracking-tight">Rewards</h1>
          <p className="text-green-700 text-sm font-body mt-1">Your gardening achievements</p>
        </div>
        <Image src="/mascots/sproutthrilled.png" alt="Sprout" width={64} height={64} className="animate-bob" />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-green-900/20 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Level card */}
          <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-2xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-green-700/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-green-500 text-xs font-body font-bold uppercase tracking-widest mb-1">Current Level</div>
                  <div className="font-display text-white text-5xl font-black leading-none">{gami?.level ?? 1}</div>
                  <div className="text-green-400 font-body font-semibold text-sm mt-1">{gami?.level_title ?? 'Seedling'}</div>
                </div>
                <Image src="/mascots/sproutthrilled.png" alt="" width={72} height={72} className="opacity-80" />
              </div>

              <div className="mb-1 flex items-center justify-between">
                <span className="text-green-400 text-xs font-body">{gami?.xp_total.toLocaleString() ?? 0} XP</span>
                <span className="text-green-600 text-xs font-body">Next: {xpToNext.toLocaleString()} XP</span>
              </div>
              <div className="h-2 bg-green-950/60 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-700"
                  style={{ width: `${xpProgress}%` }} />
              </div>

              <div className="grid grid-cols-4 gap-3 mt-5">
                {[
                  { label: 'Plants',   value: gami?.total_plants },
                  { label: 'Scans',    value: gami?.total_scans },
                  { label: 'Chats',    value: gami?.total_chats },
                  { label: 'Harvests', value: gami?.total_harvests },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="font-display text-white text-xl font-black">{s.value ?? 0}</div>
                    <div className="text-green-500 text-[10px] font-body">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-orange-950/20 border border-orange-800/30 rounded-xl p-4">
              <div className="text-3xl mb-1">🔥</div>
              <div className="font-display text-orange-300 text-3xl font-black leading-none">{gami?.streak_current ?? 0}</div>
              <div className="text-orange-600 text-xs font-body mt-1">current streak</div>
            </div>
            <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4">
              <div className="text-3xl mb-1">🏅</div>
              <div className="font-display text-amber-300 text-3xl font-black leading-none">{gami?.streak_best ?? 0}</div>
              <div className="text-amber-600 text-xs font-body mt-1">best streak</div>
            </div>
          </div>

          {/* Badges */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-green-ink text-xl font-black">Badges</h2>
              <span className="text-green-600 text-sm font-body font-semibold">{earnedCount} / {badges.length} earned</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.map(badge => (
                <div key={badge.id}
                  className={`rounded-2xl p-4 border transition-all ${badge.earned
                    ? 'bg-white border-green-200 shadow-sprout-sm hover:-translate-y-0.5'
                    : 'bg-green-900/10 border-green-900/20 opacity-50'}`}>
                  <div className="text-3xl mb-2">{badge.emoji}</div>
                  <h3 className={`font-body font-bold text-sm leading-tight mb-1 ${badge.earned ? 'text-green-ink' : 'text-green-600'}`}>
                    {badge.name}
                  </h3>
                  <p className={`text-xs font-body leading-relaxed ${badge.earned ? 'text-green-700' : 'text-green-800'}`}>
                    {badge.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-amber-500 text-xs font-body font-bold">+{badge.xp_reward} XP</span>
                    {badge.earned && (
                      <span className="text-green-500 text-[10px] font-body">✓ Earned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
