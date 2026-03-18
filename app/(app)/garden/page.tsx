'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Plant = {
  id: string; common_name: string; emoji: string; health_status: string
  day_count: number; cover_photo_url: string | null; last_action: string | null
  category: string; guild_name: string | null; chat_message_count: number
}

type ArchivedPlant = {
  id: string; common_name: string; emoji: string; category: string
  archived_at: string
}

const HEALTH_STYLE: Record<string, { label: string; dot: string; badge: string }> = {
  thriving:        { label: 'Thriving 💚',        dot: 'bg-green-400',  badge: 'bg-green-800/60 text-green-300' },
  healthy:         { label: 'Healthy',             dot: 'bg-green-500',  badge: 'bg-green-900/60 text-green-400' },
  needs_attention: { label: 'Needs Attention ⚠️',  dot: 'bg-amber-400 animate-pulse', badge: 'bg-amber-900/60 text-amber-300' },
  alert:           { label: 'Alert 🚨',            dot: 'bg-red-500 animate-pulse',   badge: 'bg-red-900/60 text-red-300' },
  dormant:         { label: 'Dormant',             dot: 'bg-stone-500',  badge: 'bg-stone-800/60 text-stone-300' },
}

export default function GardenPage() {
  const supabase = createClient()
  const [plants,  setPlants]  = useState<Plant[]>([])
  const [archived, setArchived] = useState<ArchivedPlant[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const [zone,    setZone]    = useState('')
  const [stats,   setStats]   = useState({ active: 0, healthy: 0, alerts: 0 })
  const [showTrash, setShowTrash] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [{ data: plantsData }, { data: dash }, { data: archivedData }] = await Promise.all([
      supabase.from('plant_summary').select('*').eq('user_id', user.id).eq('is_archived', false).order('created_at', { ascending: false }),
      supabase.from('user_dashboard').select('usda_zone, active_plants, plants_needing_attention').eq('user_id', user.id).single(),
      supabase.from('plants').select('id, common_name, emoji, category, archived_at').eq('user_id', user.id).eq('is_archived', true).order('archived_at', { ascending: false }),
    ])

    setPlants(plantsData ?? [])
    setArchived(archivedData ?? [])
    setZone(dash?.usda_zone ?? '')
    setStats({
      active:  dash?.active_plants ?? 0,
      healthy: (dash?.active_plants ?? 0) - (dash?.plants_needing_attention ?? 0),
      alerts:  dash?.plants_needing_attention ?? 0,
    })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function archivePlant(plantId: string, plantName: string) {
    const { error } = await supabase
      .from('plants')
      .update({ is_archived: true, archived_at: new Date().toISOString() })
      .eq('id', plantId)

    if (error) {
      toast.error('Could not archive plant')
      return
    }

    toast.success(`${plantName} moved to trash`)
    load()
  }

  async function restorePlant(plantId: string, plantName: string) {
    const { error } = await supabase
      .from('plants')
      .update({ is_archived: false, archived_at: null })
      .eq('id', plantId)

    if (error) {
      toast.error('Could not restore plant')
      return
    }

    toast.success(`${plantName} restored to garden! 🌱`)
    load()
  }

  const filtered = filter === 'all' ? plants
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
        <Link href="/identify"
          className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-body font-bold text-sm px-4 py-2.5 rounded-xl transition-all hover:-translate-y-px">
          <Image src="/mascots/sproutdigging.png" alt="" width={24} height={24} />
          Add Plant
        </Link>
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
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Image src="/mascots/sproutbase.png" alt="Sprout" width={100} height={100} className="mb-4 opacity-50" />
          <h3 className="font-display text-green-ink text-xl font-black mb-2">
            {filter === 'all' ? 'Your garden is empty' : 'No plants here yet'}
          </h3>
          <p className="text-green-700 font-body text-sm mb-6">
            {filter === 'all' ? 'Scan your first plant to get started!' : 'Try a different filter'}
          </p>
          {filter === 'all' && (
            <Link href="/identify" className="bg-green-700 hover:bg-green-600 text-white font-body font-bold px-6 py-3 rounded-xl transition-all">
              Scan a Plant 🔍
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(plant => {
            const hs = HEALTH_STYLE[plant.health_status] ?? HEALTH_STYLE.healthy
            return (
              <div key={plant.id} className="group relative bg-white border border-green-100 rounded-2xl overflow-hidden shadow-sprout-sm hover:shadow-sprout-md hover:-translate-y-1 transition-all duration-200">
                {/* Archive button */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); archivePlant(plant.id, plant.common_name) }}
                  className="absolute top-2 left-2 z-10 w-7 h-7 bg-white/80 hover:bg-red-50 border border-green-200 hover:border-red-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  title="Move to trash"
                >
                  <svg className="w-3.5 h-3.5 text-green-400 hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>

                <Link href={`/chat/${plant.id}`}>
                  {/* Photo or emoji */}
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
              </div>
            )
          })}

          {/* Add plant card */}
          <Link href="/identify"
            className="group border-2 border-dashed border-green-700/40 rounded-2xl flex flex-col items-center justify-center p-6 text-center hover:border-green-500 hover:bg-green-900/10 transition-all duration-200 min-h-[192px]">
            <Image src="/mascots/sproutdigging.png" alt="" width={56} height={56}
              className="mb-2 opacity-50 group-hover:opacity-80 group-hover:animate-bob transition-all" />
            <span className="text-green-600 font-body font-semibold text-sm group-hover:text-green-400">+ Add Plant</span>
          </Link>
        </div>
      )}

      {/* Trash section */}
      {archived.length > 0 && (
        <section className="mt-10">
          <button
            onClick={() => setShowTrash(!showTrash)}
            className="flex items-center gap-2 text-green-600 hover:text-green-500 font-body font-semibold text-sm transition-colors mb-3"
          >
            <svg className={`w-4 h-4 transition-transform ${showTrash ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            Trash ({archived.length})
          </button>

          {showTrash && (
            <div className="grid gap-2">
              {archived.map(plant => (
                <div key={plant.id}
                  className="flex items-center gap-3 bg-white/50 border border-green-100 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center text-xl opacity-50">
                    {plant.emoji ?? '🌿'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-bold text-green-ink/60 text-sm truncate">{plant.common_name}</p>
                    <p className="text-green-600/50 text-xs font-body">
                      Removed {plant.archived_at ? new Date(plant.archived_at).toLocaleDateString() : 'recently'}
                    </p>
                  </div>
                  <button
                    onClick={() => restorePlant(plant.id, plant.common_name)}
                    className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-body font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                    </svg>
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
