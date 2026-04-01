'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const ALL_CYCLES = [
  {
    id: 'chicken_garden',
    title: 'Chickens ↔ Garden',
    description: 'Chickens eat kitchen scraps and garden waste → produce eggs and manure → manure feeds your garden → garden produces more food and scraps.',
    emoji: '🐓',
    nodes: ['chicken', 'vegetable', 'compost'],
    benefit: 'Estimated $200–400/yr savings on feed and fertilizer. Closes the food waste loop completely.',
    xp: 100,
  },
  {
    id: 'aquaponics_full',
    title: 'Fish → Plants → Fish',
    description: 'Fish produce waste → bacteria convert ammonia to nitrates → plants absorb nitrates and clean the water → clean water returns to fish.',
    emoji: '🐟',
    nodes: ['fish', 'lettuce', 'basil', 'tomato', 'tilapia', 'koi'],
    benefit: 'True zero-waste system. Plants get free fertilizer, fish get clean water 24/7.',
    xp: 200,
  },
  {
    id: 'duck_pond_garden',
    title: 'Duck Pond → Garden',
    description: 'Ducks swim in pond → pond water becomes nutrient-rich → drain onto garden beds weekly → plants thrive on free fertilized water.',
    emoji: '🦆',
    nodes: ['duck', 'pond', 'vegetable', 'garden'],
    benefit: 'Free liquid fertilizer every week. Ducks also hunt slugs near the garden beds.',
    xp: 150,
  },
  {
    id: 'bee_pollination',
    title: 'Bees ↔ Garden ↔ Honey',
    description: 'Plant pollinator flowers → attract and feed bees → bees pollinate your garden increasing yields → harvest honey.',
    emoji: '🐝',
    nodes: ['bee', 'lavender', 'borage', 'sunflower', 'clover'],
    benefit: 'Up to 60% better fruit and vegetable yields from improved pollination. Plus free honey.',
    xp: 125,
  },
  {
    id: 'rabbit_compost',
    title: 'Rabbits → Best Compost',
    description: 'Rabbits eat garden trimmings and comfrey → produce the only manure safe to apply fresh → apply directly to garden with no wait.',
    emoji: '🐇',
    nodes: ['rabbit', 'comfrey', 'vegetable'],
    benefit: "Rabbit manure is gardener's gold. No burning, no composting wait. Free fertilizer daily.",
    xp: 100,
  },
  {
    id: 'comfrey_hub',
    title: 'Comfrey: The Universal Hub',
    description: 'One comfrey plant feeds chickens, ducks, goats, and rabbits as high-protein fodder — and when cut makes excellent liquid fertilizer.',
    emoji: '🌿',
    nodes: ['comfrey', 'chicken', 'goat', 'rabbit', 'duck'],
    benefit: 'Single plant serves 4+ ecosystem functions. Plant one near every animal pen.',
    xp: 75,
  },
  {
    id: 'goat_dairy_garden',
    title: 'Goats → Dairy → Garden',
    description: 'Goats browse fodder plants → produce milk and manure → cool manure applied directly to beds → grow fodder plants to feed goats.',
    emoji: '🐐',
    nodes: ['goat', 'comfrey', 'chicory', 'vegetable'],
    benefit: 'Fresh dairy every day plus the safest manure available. Fully circular.',
    xp: 150,
  },
  {
    id: 'three_sisters_chickens',
    title: 'Three Sisters + Chickens',
    description: 'Grow corn + beans + squash together → chickens free-range after harvest eating pests and scratching in the beds → nitrogen-fixed soil ready for next season.',
    emoji: '🌽',
    nodes: ['corn', 'bean', 'squash', 'chicken'],
    benefit: 'Ancient companion planting meets modern homesteading. Zero tilling needed.',
    xp: 175,
  },
]

export default function EcosystemPage() {
  const supabase = createClient()
  const [plants,  setPlants]  = useState<any[]>([])
  const [animals, setAnimals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: p }, { data: a }] = await Promise.all([
        supabase.from('plants').select('id, common_name, emoji, category').eq('user_id', user.id).eq('is_archived', false),
        supabase.from('animals').select('id, species, name, emoji, count').eq('user_id', user.id).eq('is_archived', false),
      ])
      setPlants(p ?? [])
      setAnimals(a ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const allItemNames = [
    ...plants.map((p: any) => p.common_name.toLowerCase()),
    ...animals.map((a: any) => a.species.toLowerCase()),
    ...animals.map((a: any) => (a.name ?? '').toLowerCase()),
  ]

  function cycleIsActive(cycle: any) {
    return cycle.nodes.some((node: string) =>
      allItemNames.some(item => item.includes(node) || node.includes(item))
    )
  }

  const activeCycles    = ALL_CYCLES.filter(c => cycleIsActive(c))
  const suggestedCycles = ALL_CYCLES.filter(c => !cycleIsActive(c))
  const hasAnything = plants.length > 0 || animals.length > 0

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-green-ink text-3xl font-black tracking-tight">Ecosystem Cycles</h1>
          <p className="text-green-700 text-sm font-body mt-0.5">
            Every plant feeds an animal. Every animal feeds a plant. Close the loops.
          </p>
        </div>
        <Image src="/mascots/sproutthrilled.png" alt="Sprout" width={64} height={64} className="animate-bob" />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-green-900/20 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !hasAnything ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔄</div>
          <h3 className="font-display text-green-ink text-xl font-black mb-3">Your ecosystem starts here</h3>
          <p className="text-green-700 font-body text-sm mb-8 max-w-md mx-auto leading-relaxed">
            Add plants and animals to SPROUT and we will show you exactly how they support each other — cutting your costs and closing your food loops.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/garden" className="bg-green-700 hover:bg-green-600 text-white font-body font-bold px-5 py-2.5 rounded-xl text-sm transition-all">🌿 Add Plants</Link>
            <Link href="/animals" className="bg-green-700 hover:bg-green-600 text-white font-body font-bold px-5 py-2.5 rounded-xl text-sm transition-all">🐾 Add Animals</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Farm snapshot */}
          <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-2xl p-5 mb-8">
            <p className="text-green-400 text-xs font-body font-bold uppercase tracking-wider mb-3">Your Farm</p>
            <div className="flex flex-wrap gap-2">
              {[...plants, ...animals.map((a: any) => ({
                id: a.id, common_name: a.name ?? `${a.count} ${a.species}s`, emoji: a.emoji
              }))].map((item: any) => (
                <div key={item.id} className="flex items-center gap-1.5 bg-green-800/60 border border-green-700/40 rounded-full px-3 py-1.5">
                  <span className="text-sm">{item.emoji}</span>
                  <span className="text-green-200 text-xs font-body font-semibold">{item.common_name}</span>
                </div>
              ))}
            </div>
          </div>

          {activeCycles.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-green-ink text-xl font-black mb-1">✅ Active Cycles</h2>
              <p className="text-green-700 text-sm font-body mb-4">These loops are possible right now with what you already have.</p>
              <div className="space-y-4">
                {activeCycles.map(cycle => (
                  <div key={cycle.id} className="bg-white border-2 border-green-200 rounded-2xl p-5 shadow-sprout-sm">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl flex-shrink-0">{cycle.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-display text-green-ink font-black text-lg leading-tight">{cycle.title}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cycle.nodes.map((n: string) => (
                            <span key={n} className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-body font-semibold capitalize">{n}</span>
                          ))}
                        </div>
                      </div>
                      <span className="text-amber-700 text-xs font-body font-bold flex-shrink-0">+{cycle.xp} XP</span>
                    </div>
                    <p className="text-green-700 font-body text-sm leading-relaxed mb-3">{cycle.description}</p>
                    <div className="bg-green-50 rounded-xl px-4 py-2.5">
                      <p className="text-green-600 text-xs font-body font-semibold">💰 {cycle.benefit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggestedCycles.length > 0 && (
            <div>
              <h2 className="font-display text-green-ink text-xl font-black mb-1">💡 Unlock These Cycles</h2>
              <p className="text-green-700 text-sm font-body mb-4">Add these plants or animals to unlock powerful new loops.</p>
              <div className="space-y-3">
                {suggestedCycles.map(cycle => (
                  <div key={cycle.id} className="bg-green-900/10 border border-green-800/20 rounded-2xl p-4 hover:border-green-600/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{cycle.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-green-ink font-black text-base">{cycle.title}</h3>
                        <div className="flex flex-wrap gap-1 mt-1 mb-2">
                          {cycle.nodes.map((n: string) => (
                            <span key={n} className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-body font-semibold capitalize">{n}</span>
                          ))}
                        </div>
                        <p className="text-green-600 text-xs font-body leading-relaxed">{cycle.benefit}</p>
                      </div>
                      <span className="text-amber-700 text-xs font-body font-bold flex-shrink-0">+{cycle.xp} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
