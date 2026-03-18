'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Plant = {
  id: string
  common_name: string
  latin_name: string
  emoji: string
  health_status: string
  day_count: number
}

const HEALTH_COLOR: Record<string, string> = {
  thriving: 'text-green-400',
  healthy: 'text-green-500',
  needs_attention: 'text-amber-500',
  alert: 'text-red-400',
  dormant: 'text-stone-400',
}

const APP_TIPS = [
  {
    icon: '🔍',
    title: 'Identify a Plant',
    desc: 'Go to Identify, snap a photo, and Sprout will tell you exactly what it is — plus zone-specific care tips.',
    href: '/identify',
  },
  {
    icon: '🌿',
    title: 'Your Garden',
    desc: 'All your identified and added plants live here. Track health, watering schedules, and day counts.',
    href: '/garden',
  },
  {
    icon: '🤝',
    title: 'Companion Planting',
    desc: 'Find out which plants grow better together — and which ones to keep apart.',
    href: '/companions',
  },
  {
    icon: '📐',
    title: 'Garden Planner',
    desc: 'Design your garden layout with AI. Get a plant list, companion guilds, and seasonal tips.',
    href: '/planner',
  },
  {
    icon: '🏆',
    title: 'Rewards & XP',
    desc: 'Earn XP by chatting, identifying plants, planning gardens, and keeping your streak alive.',
    href: '/rewards',
  },
]

export default function ChatIndexPage() {
  const supabase = createClient()
  const router = useRouter()
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('plants')
        .select('id, common_name, latin_name, emoji, health_status, day_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setPlants(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-green-ink text-3xl font-black tracking-tight">
            Chat with Sprout
          </h1>
          <p className="text-green-700 text-sm font-body mt-1">
            Your AI gardening companion — ask anything
          </p>
        </div>
        <Image
          src="/mascots/sproutsmiling.png"
          alt="Sprout"
          width={64}
          height={64}
          className="animate-bob"
        />
      </div>

      {/* Plant Conversations */}
      <section className="mb-10">
        <h2 className="font-display text-green-ink text-lg font-black mb-3 flex items-center gap-2">
          <span>🌱</span> Your Plants
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-green-600/30 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : plants.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <Image
              src="/mascots/sproutsearching.png"
              alt="Sprout searching"
              width={80}
              height={80}
              className="mx-auto mb-4 opacity-60"
            />
            <h3 className="font-display text-green-ink text-lg font-black mb-2">
              No plants yet!
            </h3>
            <p className="text-green-700 font-body text-sm mb-4 max-w-sm mx-auto">
              Add your first plant by identifying it with a photo.
              Then you can chat with Sprout about its care.
            </p>
            <Link
              href="/identify"
              className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-body font-bold text-sm px-5 py-2.5 rounded-xl transition-all hover:-translate-y-px"
            >
              🔍 Identify Your First Plant
            </Link>
          </div>
        ) : (
          <div className="grid gap-2">
            {plants.map(plant => (
              <Link
                key={plant.id}
                href={`/chat/${plant.id}`}
                className="flex items-center gap-3 bg-white border border-green-100 hover:border-green-300 rounded-xl px-4 py-3 transition-all hover:shadow-md group"
              >
                <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center text-2xl transition-colors">
                  {plant.emoji ?? '🌿'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-bold text-green-ink text-sm truncate">
                    {plant.common_name}
                  </p>
                  <p className={`text-xs font-body font-semibold ${HEALTH_COLOR[plant.health_status] ?? 'text-green-500'}`}>
                    {plant.health_status.replace('_', ' ')} · Day {plant.day_count}
                  </p>
                </div>
                <span className="text-green-400 group-hover:text-green-600 transition-colors text-sm">
                  💬
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* App Guide */}
      <section>
        <h2 className="font-display text-green-ink text-lg font-black mb-3 flex items-center gap-2">
          <span>📖</span> How SPROUT Works
        </h2>
        <div className="grid gap-2">
          {APP_TIPS.map(tip => (
            <Link
              key={tip.href}
              href={tip.href}
              className="flex items-start gap-3 bg-white border border-green-100 hover:border-green-300 rounded-xl px-4 py-3 transition-all hover:shadow-md group"
            >
              <span className="text-xl mt-0.5">{tip.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-body font-bold text-green-ink text-sm">
                  {tip.title}
                </p>
                <p className="text-green-600 font-body text-xs leading-relaxed mt-0.5">
                  {tip.desc}
                </p>
              </div>
              <span className="text-green-300 group-hover:text-green-500 transition-colors mt-1">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
