'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import AddPlantModal from './add-plant-modal'

type Plant = {
  id: string; common_name: string; emoji: string; health_status: string
  day_count: number; cover_photo_url: string | null; last_action: string | null
  category: string; guild_name: string | null; chat_message_count: number
}

const HEALTH_STYLE: Record<string, { label: string; dot: string; badge: string }> = {
  thriving:        { label: 'Thriving 💚',       dot: 'bg-green-400',               badge: 'bg-green-800/60 text-green-300' },
  healthy:         { label: 'Healthy',            dot: 'bg-green-500',               badge: 'bg-green-900/60 text-green-400' },
  needs_attention: { label: 'Needs Attention ⚠️', dot: 'bg-amber-400 animate-pulse', badge: 'bg-amber-900/60 text-amber-300' },
  alert:           { label: 'Alert 🚨',           dot: 'bg-red-500 animate-pulse',   badge: 'bg-red-900/60 text-red-300' },
  dormant:         { label: 'Dormant',            dot: 'bg-stone-500',               badge: 'bg-stone-800/60 text-stone-300' },
}

export default function GardenPage() {
  const supabase = createClient()
  const [plants,       setPlants]       = useState<Plant[]>([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState('all')
  const [zone,         setZone]         = useState('')
  const [stats,        setStats]        = useState({ active: 0, healthy: 0, alerts: 0 })
  const [showAddModal, setShowAddModal] = useState(false)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: plantsData }, { data: dash }] = await Promise.all([
      supabase.from('sprout_plant_summary').select('*').eq('user_id', user.id).eq('is_archived', false).order('created_at', { ascending: false }),
      supabase.from('sprout_user_dashboard').select('usda_zone, active_plants, plants_needing_attention').eq('user_id', user.id).single(),
    ])

    setPlants(plantsData ?? [])
    setZone(dash?.usda_zone ?? '')
    setStats({
      active:  dash?.active_plants ?? 0,
      healthy: (dash?.active_plants ?? 0) - (dash?.plants_needing_attention ?? 0),
      alerts:  dash?.plants_needing_attention ?? 0,
    })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all'    ? plants
    : filter === 'alerts' ? plants.filter(p => p.health_status === 'alert' || p.health_status === 'needs_attention')
    : plants.filter(p => p.category === filter)

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-green-ink text-3xl font-black tracking-tight">My Garden</h1>
          {zone && <p className="text-green-700 text-sm font-body mt-0.5">Zone {zone} · {stats.active} plants · {stats.healthy} healthy</p>}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-body font-bold text-sm px-4 py-2.5 rounded-xl transition-all hover:-translate-y-px shadow-sprout-sm"
        >
          <Image src="/mascots/sproutdigging.png" alt="" width={24} height={24} />
          Add Plant
        </button>
      </div>

      {/* Alerts banner */}
      {stats.alerts > 0 && (
        <div className="bg-amber-900/30 border border-amber-700/40 rounded-xl px-4 py-3 flex items-center gap-3 mb-5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          <p className="text-amber-300 text-sm font-body font-semibold">
            {stats.alerts} plant{stats.alerts > 1 ? 's' : ''} need{stats.alerts === 1 ? 's' : ''} attention
          </p>
          <button onClick={() => setFilter('alerts')} className="ml-auto text-amber-400 text-xs font-body font-bold hover:text-amber-300">
            View →
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['all', 'alerts', 'vegetable', 'herb', 'flower', 'fruit'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-body font-semibold capitalize transition-all
              ${filter === f ? 'bg-green-700 text-white' : 'bg-green-900/30 text-green-600 hover:text-green-400'}`}>
            {f === 'alerts' ? '⚠️ Needs Care' : f === 'all' ? '🌿 All' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-green-900/20 rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 && filter === 'all' && plants.length === 0 ? (
        // Empty garden state
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Image src="/mascots/sproutbase.png" alt="Sprout" width={120} height={120}
            className="mb-6 drop-shadow-xl animate-bob" />
          <h3 className="font-display text-green-ink text-2xl font-black mb-3">
            Your garden is empty
          </h3>
          <p className="text-green-700 font-body text-sm mb-8 max-w-xs leading-relaxed">
            Add your first plant to get started — scan a photo, search by name, or tell Sprout what you&apos;re growing.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-700 hover:bg-green-600 text-white font-body font-bold px-8 py-4 rounded-xl transition-all hover:-translate-y-px text-base shadow-sprout-md"
          >
            Add Your First Plant 🌱
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={80} height={80} className="mb-4 opacity-50" />
          <p className="text-green-700 font-body text-sm">No plants match this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(plant => {
            const hs = HEALTH_STYLE[plant.health_status] ?? HEALTH_STYLE.healthy
            return (
              <Link key={plant.id} href={`/chat/${plant.id}`}
                className="group bg-white border border-green-100 rounded-2xl overflow-hidden shadow-sprout-sm hover:shadow-sprout-md hover:-translate-y-1 transition-all duration-200">
                <div className="h-28 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-5xl relative overflow-hidden">
                  {plant.cover_photo_url
                    ? <img src={plant.cover_photo_url} alt={plant.common_name} className="w-full h-full object-cover" />
                    : <span>{plant.emoji ?? '🌿'}</span>
                  }
                  <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${hs.dot}`} />
                </div>
                <div className="p-3">
                  <h3 className="font-body font-bold text-green-ink text-sm leading-tight mb-1 truncate">
                    {plant.common_name}
                  </h3>
                  <span className={`inline-flex text-[10px] font-body font-semibold px-2 py-0.5 rounded-full ${hs.badge}`}>
                    {hs.label}
                  </span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-green-600 text-[11px] font-body">Day {plant.day_count}</span>
                    {plant.chat_message_count > 0 && (
                      <span className="text-green-500 text-[11px] font-body">💬 {plant.chat_message_count}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Add plant card */}
          <button
            onClick={() => setShowAddModal(true)}
            className="group border-2 border-dashed border-green-700/40 rounded-2xl flex flex-col items-center justify-center p-6 text-center hover:border-green-500 hover:bg-green-900/10 transition-all duration-200 min-h-[192px]">
            <Image src="/mascots/sproutdigging.png" alt="" width={56} height={56}
              className="mb-2 opacity-50 group-hover:opacity-80 group-hover:animate-bob transition-all" />
            <span className="text-green-600 font-body font-semibold text-sm group-hover:text-green-400">+ Add Plant</span>
          </button>
        </div>
      )}

      {/* Add Plant Modal */}
      {showAddModal && (
        <AddPlantModal onClose={() => { setShowAddModal(false); load() }} />
      )}
    </div>
  )
}
