'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type Companion = { plant_a: string; plant_b: string; relationship: string; benefit: string }

export default function CompanionsPage() {
  const supabase = createClient()
  const [search,     setSearch]     = useState('')
  const [companions, setCompanions] = useState<Companion[]>([])
  const [loading,    setLoading]    = useState(false)
  const [myPlants,   setMyPlants]   = useState<{ common_name: string; emoji: string }[]>([])
  const [selected,   setSelected]   = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('plants').select('common_name, emoji').eq('user_id', user.id).eq('is_archived', false)
        .then(({ data }) => setMyPlants(data ?? []))
    })
  }, [])

  async function lookup(name: string) {
    if (!name.trim()) return
    setLoading(true)
    const { data } = await supabase.from('companion_catalogue')
      .select('*')
      .or(`plant_a.ilike.%${name}%,plant_b.ilike.%${name}%`)
      .limit(20)
    setCompanions(data ?? [])
    setLoading(false)
  }

  const relStyle: Record<string, { bg: string; text: string; icon: string }> = {
    loves:   { bg: 'bg-green-100 border-green-200',  text: 'text-green-700',  icon: '💚' },
    hates:   { bg: 'bg-red-50 border-red-200',       text: 'text-red-600',    icon: '✗' },
    neutral: { bg: 'bg-gray-50 border-gray-200',     text: 'text-gray-500',   icon: '—' },
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-green-ink text-3xl font-black tracking-tight">Companion Planting</h1>
          <p className="text-green-700 text-sm font-body mt-1">Discover which plants thrive together</p>
        </div>
        <Image src="/mascots/sproutdigging.png" alt="Sprout" width={64} height={64} className="animate-bob" />
      </div>

      {/* My plants quick-select */}
      {myPlants.length > 0 && (
        <div className="mb-4">
          <p className="text-green-700 text-xs font-body font-bold uppercase tracking-widest mb-2">My Garden</p>
          <div className="flex gap-2 flex-wrap">
            {myPlants.map(p => (
              <button key={p.common_name}
                onClick={() => { setSelected(p.common_name); setSearch(p.common_name); lookup(p.common_name) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-semibold border transition-all
                  ${selected === p.common_name ? 'bg-green-700 text-white border-green-600' : 'bg-white border-green-200 text-green-700 hover:border-green-400'}`}>
                <span>{p.emoji}</span>{p.common_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && lookup(search)}
          placeholder="Search any plant (e.g. Tomato, Basil, Rose...)"
          className="flex-1 bg-white border border-green-200 text-green-ink placeholder-green-400 font-body text-sm px-4 py-3 rounded-xl outline-none focus:border-green-500 transition-colors shadow-sprout-sm"
        />
        <button onClick={() => lookup(search)} disabled={loading || !search.trim()}
          className="bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-body font-bold px-5 py-3 rounded-xl transition-all hover:-translate-y-px">
          {loading ? '...' : '🔍'}
        </button>
      </div>

      {/* Results */}
      {companions.length === 0 && !loading && (
        <div className="text-center py-16">
          <Image src="/mascots/sproutdigging.png" alt="Sprout" width={80} height={80} className="mx-auto mb-4 opacity-40" />
          <p className="text-green-700 font-body text-sm">
            Search for a plant to see its companions, or pick one from your garden above
          </p>
        </div>
      )}

      {companions.length > 0 && (
        <div className="space-y-3">
          <p className="text-green-600 text-xs font-body font-semibold">
            {companions.length} relationship{companions.length !== 1 ? 's' : ''} found
          </p>
          {companions.map((c, i) => {
            const style = relStyle[c.relationship] ?? relStyle.neutral
            const partner = c.plant_a.toLowerCase().includes(search.toLowerCase()) ? c.plant_b : c.plant_a
            return (
              <div key={i} className={`border rounded-xl p-4 ${style.bg} transition-all`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{style.icon}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-body font-bold text-sm ${style.text}`}>
                      {search ? (c.plant_a.toLowerCase().includes(search.toLowerCase()) ? c.plant_a : c.plant_b) : c.plant_a}
                    </span>
                    <span className="text-green-400 text-xs">↔</span>
                    <span className={`font-body font-bold text-sm ${style.text}`}>{partner}</span>
                  </div>
                  <span className={`ml-auto text-xs font-body font-semibold px-2 py-0.5 rounded-full capitalize
                    ${c.relationship === 'loves' ? 'bg-green-200 text-green-700' : c.relationship === 'hates' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                    {c.relationship}
                  </span>
                </div>
                {c.benefit && (
                  <p className={`text-xs font-body leading-relaxed ${style.text} opacity-80`}>{c.benefit}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
