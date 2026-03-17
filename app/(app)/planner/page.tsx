'use client'
import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { generateLayout, generateStructure } from '@/lib/api'
import toast from 'react-hot-toast'

const GOALS     = ['food_production','cut_flowers','medicinal','pollinators','privacy','aesthetics','child_friendly']
const GOAL_LABELS: Record<string, string> = { food_production:'🍅 Food', cut_flowers:'💐 Cut Flowers', medicinal:'🌿 Medicinal', pollinators:'🐝 Pollinators', privacy:'🌳 Privacy Screen', aesthetics:'🌸 Aesthetics', child_friendly:'👶 Kid-Friendly' }
const STRUCTURES = ['raised_bed','trellis','cold_frame','hoop_house','compost_bin','vertical_pallet','herb_spiral','keyhole_bed']
const STRUCT_LABELS: Record<string, string> = { raised_bed:'🌱 Raised Bed', trellis:'🌿 Trellis', cold_frame:'🧊 Cold Frame', hoop_house:'🏠 Hoop House', compost_bin:'♻️ Compost Bin', vertical_pallet:'📦 Vertical Pallet', herb_spiral:'🌀 Herb Spiral', keyhole_bed:'🔑 Keyhole Bed' }

export default function PlannerPage() {
  const supabase = createClient()
  const [tab,         setTab]         = useState<'layout'|'structure'>('layout')
  const [generating,  setGenerating]  = useState(false)
  const [result,      setResult]      = useState<any>(null)

  // Layout form
  const [lWidth,     setLWidth]     = useState('')
  const [lLength,    setLLength]    = useState('')
  const [spaceType,  setSpaceType]  = useState('raised_beds')
  const [goals,      setGoals]      = useState<string[]>([])
  const [sun,        setSun]        = useState('full_sun')
  const [skill,      setSkill]      = useState('beginner')
  const [time,       setTime]       = useState('5')

  // Structure form
  const [sType,    setSType]    = useState('raised_bed')
  const [sWidth,   setSWidth]   = useState('')
  const [sLength,  setSLength]  = useState('')
  const [sHeight,  setSHeight]  = useState('')

  function toggleGoal(g: string) {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  async function handleGenerateLayout() {
    if (!lWidth || !lLength || goals.length === 0) { toast.error('Fill in dimensions and at least one goal'); return }
    setGenerating(true)
    setResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not signed in')
      const data = await generateLayout(session.access_token, {
        width_ft: parseFloat(lWidth), length_ft: parseFloat(lLength),
        space_type: spaceType, goals, sun_exposure: sun,
        soil_type: 'raised_mix', budget_range: 'medium',
        skill_level: skill, time_per_week: parseInt(time),
      })
      setResult(data)
      toast.success(`🌿 Layout generated! +${(data as any).xp_earned ?? 30} XP`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateStructure() {
    if (!sWidth || !sLength) { toast.error('Enter dimensions'); return }
    setGenerating(true)
    setResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not signed in')
      const data = await generateStructure(session.access_token, {
        structure_type: sType, width_ft: parseFloat(sWidth),
        length_ft: parseFloat(sLength), height_ft: sHeight ? parseFloat(sHeight) : undefined,
      })
      setResult(data)
      toast.success(`🏗️ Build plan ready! +${(data as any).xp_earned ?? 30} XP`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-green-ink text-3xl font-black tracking-tight">Garden Planner</h1>
          <p className="text-green-700 text-sm font-body mt-1">Design your space with AI</p>
        </div>
        <Image src="/mascots/sproutdigging.png" alt="Sprout" width={64} height={64} className="animate-bob" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ id: 'layout', label: '📐 Layout Generator' }, { id: 'structure', label: '🏗️ Structure Builder' }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id as any); setResult(null) }}
            className={`px-5 py-2.5 rounded-xl font-body font-semibold text-sm transition-all
              ${tab === t.id ? 'bg-green-700 text-white' : 'bg-green-900/20 text-green-600 hover:text-green-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white border border-green-100 rounded-2xl p-6 shadow-sprout-sm">
          {tab === 'layout' ? (
            <>
              <h2 className="font-display text-green-ink text-lg font-black mb-4">Your Space</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-green-600 text-xs font-body font-bold block mb-1">Width (ft)</label>
                  <input value={lWidth} onChange={e => setLWidth(e.target.value)} placeholder="4"
                    className="w-full border border-green-200 text-green-ink font-body text-sm px-3 py-2 rounded-lg outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-green-600 text-xs font-body font-bold block mb-1">Length (ft)</label>
                  <input value={lLength} onChange={e => setLLength(e.target.value)} placeholder="8"
                    className="w-full border border-green-200 text-green-ink font-body text-sm px-3 py-2 rounded-lg outline-none focus:border-green-500" />
                </div>
              </div>

              <div className="mb-4">
                <label className="text-green-600 text-xs font-body font-bold block mb-2">Goals</label>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map(g => (
                    <button key={g} onClick={() => toggleGoal(g)}
                      className={`px-3 py-1.5 rounded-full text-xs font-body font-semibold border transition-all
                        ${goals.includes(g) ? 'bg-green-700 text-white border-green-600' : 'border-green-200 text-green-600 hover:border-green-400'}`}>
                      {GOAL_LABELS[g]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="text-green-600 text-xs font-body font-bold block mb-1">Sunlight</label>
                  <select value={sun} onChange={e => setSun(e.target.value)}
                    className="w-full border border-green-200 text-green-ink font-body text-sm px-3 py-2 rounded-lg outline-none focus:border-green-500">
                    <option value="full_sun">Full Sun</option>
                    <option value="part_shade">Part Shade</option>
                    <option value="full_shade">Full Shade</option>
                  </select>
                </div>
                <div>
                  <label className="text-green-600 text-xs font-body font-bold block mb-1">Skill Level</label>
                  <select value={skill} onChange={e => setSkill(e.target.value)}
                    className="w-full border border-green-200 text-green-ink font-body text-sm px-3 py-2 rounded-lg outline-none focus:border-green-500">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <button onClick={handleGenerateLayout} disabled={generating}
                className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-body font-bold py-3 rounded-xl transition-all hover:-translate-y-px">
                {generating ? 'Generating Layout...' : '✨ Generate Layout +30 XP'}
              </button>
            </>
          ) : (
            <>
              <h2 className="font-display text-green-ink text-lg font-black mb-4">Structure Type</h2>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {STRUCTURES.map(s => (
                  <button key={s} onClick={() => setSType(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-body font-semibold border transition-all text-left
                      ${sType === s ? 'bg-green-700 text-white border-green-600' : 'border-green-200 text-green-600 hover:border-green-400'}`}>
                    {STRUCT_LABELS[s]}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[{ label: 'Width (ft)', val: sWidth, set: setSWidth },
                  { label: 'Length (ft)', val: sLength, set: setSLength },
                  { label: 'Height (ft)', val: sHeight, set: setSHeight }].map(f => (
                  <div key={f.label}>
                    <label className="text-green-600 text-xs font-body font-bold block mb-1">{f.label}</label>
                    <input value={f.val} onChange={e => f.set(e.target.value)} placeholder="—"
                      className="w-full border border-green-200 text-green-ink font-body text-sm px-3 py-2 rounded-lg outline-none focus:border-green-500" />
                  </div>
                ))}
              </div>
              <button onClick={handleGenerateStructure} disabled={generating}
                className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-body font-bold py-3 rounded-xl transition-all hover:-translate-y-px">
                {generating ? 'Building Plan...' : '🏗️ Generate Build Plan +30 XP'}
              </button>
            </>
          )}
        </div>

        {/* Result */}
        <div>
          {generating ? (
            <div className="h-full flex flex-col items-center justify-center bg-green-900/10 rounded-2xl p-8 text-center">
              <Image src="/mascots/sproutdigging.png" alt="Sprout" width={80} height={80} className="mb-4 animate-bob" />
              <p className="text-green-600 font-body font-semibold text-sm animate-pulse">
                Sprout is designing your {tab === 'layout' ? 'garden' : 'build plan'}...
              </p>
            </div>
          ) : !result ? (
            <div className="h-full flex flex-col items-center justify-center bg-green-900/10 rounded-2xl p-8 text-center">
              <Image src="/mascots/sproutbase.png" alt="Sprout" width={80} height={80} className="mb-4 opacity-40" />
              <p className="text-green-700 font-body text-sm">
                Fill in your space details and hit Generate to see your personalized plan here
              </p>
            </div>
          ) : (
            <div className="bg-white border border-green-100 rounded-2xl shadow-sprout-md overflow-hidden max-h-[600px] overflow-y-auto">
              <div className="bg-gradient-to-br from-green-800 to-green-900 px-5 py-4">
                <h3 className="font-display text-white text-lg font-black">
                  {result.layout_name ?? result.structure_name ?? 'Your Plan'}
                </h3>
                {result.ai_notes && <p className="text-green-300 text-xs font-body mt-1 leading-relaxed">{result.ai_notes}</p>}
              </div>
              <div className="p-4 space-y-4 text-sm font-body">
                {/* Layout plants */}
                {result.plants && (
                  <div>
                    <p className="text-green-600 text-xs font-bold uppercase tracking-wide mb-2">Plants ({result.plants.length})</p>
                    <div className="space-y-1.5">
                      {result.plants.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
                          <span>{p.emoji}</span>
                          <span className="font-semibold text-green-ink text-xs">{p.common_name}</span>
                          <span className="text-green-500 text-xs ml-auto">{p.plant_month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Materials list */}
                {result.materials_list && (
                  <div>
                    <p className="text-green-600 text-xs font-bold uppercase tracking-wide mb-2">Materials List</p>
                    <div className="space-y-1.5">
                      {result.materials_list.map((m: any, i: number) => (
                        <div key={i} className="flex items-start justify-between gap-2 bg-amber-50 rounded-lg px-3 py-2">
                          <div>
                            <span className="font-semibold text-green-ink text-xs">{m.item}</span>
                            {m.notes && <p className="text-green-600 text-[10px] mt-0.5">{m.notes}</p>}
                          </div>
                          <span className="text-amber-700 text-xs font-bold flex-shrink-0">{m.quantity} {m.unit}</span>
                        </div>
                      ))}
                    </div>
                    {result.estimated_cost_low && (
                      <p className="text-green-700 text-xs font-semibold mt-2">
                        Estimated cost: ${result.estimated_cost_low}–${result.estimated_cost_high}
                      </p>
                    )}
                  </div>
                )}
                {/* Instructions */}
                {result.instructions && (
                  <div>
                    <p className="text-green-600 text-xs font-bold uppercase tracking-wide mb-2">Build Steps</p>
                    <div className="space-y-2">
                      {result.instructions.map((s: any) => (
                        <div key={s.step} className="flex gap-2">
                          <span className="flex-shrink-0 w-5 h-5 bg-green-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{s.step}</span>
                          <div>
                            <p className="font-semibold text-green-ink text-xs">{s.title}</p>
                            <p className="text-green-600 text-[11px] leading-relaxed">{s.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
