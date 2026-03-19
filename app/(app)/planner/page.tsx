'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// ─── Square Foot Gardening spacing rules ─────────────────────────────
const SFG_SPACING: Record<string, { sqft: number; label: string; color: string }> = {
  default:    { sqft: 1,    label: '1 per sq ft',  color: '#5A9E65' },
  large:      { sqft: 1,    label: '1 per sq ft',  color: '#5A9E65' },
  medium:     { sqft: 0.25, label: '4 per sq ft',  color: '#82C08B' },
  small:      { sqft: 0.11, label: '9 per sq ft',  color: '#B8DDBC' },
  tiny:       { sqft: 0.06, label: '16 per sq ft', color: '#E2F2E4' },
}

const PLANT_SIZE: Record<string, string> = {
  tomato: 'large', pepper: 'large', squash: 'large', zucchini: 'large',
  cucumber: 'large', eggplant: 'large', broccoli: 'large', cauliflower: 'large',
  cabbage: 'large', kale: 'medium', lettuce: 'medium', spinach: 'medium',
  chard: 'medium', beet: 'small', carrot: 'small', radish: 'small',
  turnip: 'small', onion: 'small', basil: 'tiny', chive: 'tiny',
  cilantro: 'tiny', parsley: 'tiny', thyme: 'tiny', oregano: 'tiny',
}

function getPlantSize(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, size] of Object.entries(PLANT_SIZE)) {
    if (lower.includes(key)) return size
  }
  return 'default'
}

// ─── Garden Implements ────────────────────────────────────────────────
type ImplementDef = {
  id: string; name: string; emoji: string; category: string
  w: number; h: number; color: string; borderColor: string
  description: string; canHoldPlants: boolean
  maxPlants?: number
}

const IMPLEMENTS: ImplementDef[] = [
  // Beds
  { id: 'raised_4x8',   name: '4×8 Raised Bed',    emoji: '📦', category: 'Beds',       w: 8,  h: 4,  color: '#7C5C30', borderColor: '#A0744A', description: 'Classic raised bed, 32 sq ft', canHoldPlants: true },
  { id: 'raised_4x4',   name: '4×4 Raised Bed',    emoji: '📦', category: 'Beds',       w: 4,  h: 4,  color: '#7C5C30', borderColor: '#A0744A', description: 'Square raised bed, 16 sq ft',  canHoldPlants: true },
  { id: 'raised_2x6',   name: '2×6 Raised Bed',    emoji: '📦', category: 'Beds',       w: 6,  h: 2,  color: '#7C5C30', borderColor: '#A0744A', description: 'Narrow raised bed, 12 sq ft',  canHoldPlants: true },
  { id: 'inground_4x8', name: '4×8 In-Ground Bed', emoji: '🌍', category: 'Beds',       w: 8,  h: 4,  color: '#5C3D1E', borderColor: '#7C5C30', description: 'Tilled in-ground bed',          canHoldPlants: true },
  { id: 'inground_4x4', name: '4×4 In-Ground Bed', emoji: '🌍', category: 'Beds',       w: 4,  h: 4,  color: '#5C3D1E', borderColor: '#7C5C30', description: 'Square in-ground bed',          canHoldPlants: true },
  { id: 'herb_spiral',  name: 'Herb Spiral',        emoji: '🌀', category: 'Beds',       w: 4,  h: 4,  color: '#3D7048', borderColor: '#5A9E65', description: 'Tiered herb spiral',            canHoldPlants: true },
  // Containers
  { id: 'pot_large',    name: 'Large Pot',          emoji: '🪴', category: 'Containers', w: 2,  h: 2,  color: '#C04E28', borderColor: '#E06B3A', description: '2×2 ft container pot',          canHoldPlants: true, maxPlants: 1 },
  { id: 'pot_small',    name: 'Small Pot',          emoji: '🪴', category: 'Containers', w: 1,  h: 1,  color: '#C04E28', borderColor: '#E06B3A', description: '1×1 ft small pot',              canHoldPlants: true, maxPlants: 1 },
  { id: 'window_box',   name: 'Window Box',         emoji: '🌸', category: 'Containers', w: 4,  h: 1,  color: '#C04E28', borderColor: '#E06B3A', description: '4×1 ft window box',             canHoldPlants: true },
  { id: 'half_barrel',  name: 'Half Barrel',        emoji: '🛢️', category: 'Containers', w: 2,  h: 2,  color: '#8B4513', borderColor: '#A0522D', description: 'Large barrel planter',          canHoldPlants: true, maxPlants: 3 },
  // Structures
  { id: 'trellis_8',    name: '8ft Trellis',        emoji: '🪜', category: 'Structures', w: 8,  h: 1,  color: '#2C5233', borderColor: '#3D7048', description: 'Vertical climbing structure',   canHoldPlants: true },
  { id: 'trellis_4',    name: '4ft Trellis',        emoji: '🪜', category: 'Structures', w: 4,  h: 1,  color: '#2C5233', borderColor: '#3D7048', description: 'Shorter trellis',               canHoldPlants: true },
  { id: 'arch',         name: 'Garden Arch',        emoji: '🌈', category: 'Structures', w: 3,  h: 2,  color: '#2C5233', borderColor: '#3D7048', description: 'Decorative climbing arch',      canHoldPlants: true },
  { id: 'cold_frame',   name: 'Cold Frame',         emoji: '🧊', category: 'Structures', w: 4,  h: 2,  color: '#4A90C4', borderColor: '#6BAED6', description: 'Season extender',               canHoldPlants: true },
  { id: 'hoop_house',   name: 'Hoop House',         emoji: '⛺', category: 'Structures', w: 8,  h: 4,  color: '#4A90C4', borderColor: '#6BAED6', description: 'Mini greenhouse tunnel',        canHoldPlants: true },
  // Utilities
  { id: 'compost',      name: 'Compost Bin',        emoji: '♻️', category: 'Utilities',  w: 3,  h: 3,  color: '#556B2F', borderColor: '#6B8E23', description: '3×3 compost area',              canHoldPlants: false },
  { id: 'water_butt',   name: 'Water Butt',         emoji: '💧', category: 'Utilities',  w: 1,  h: 1,  color: '#4A90C4', borderColor: '#6BAED6', description: 'Rainwater collection',          canHoldPlants: false },
  { id: 'shed',         name: 'Garden Shed',        emoji: '🏠', category: 'Utilities',  w: 6,  h: 4,  color: '#8B7355', borderColor: '#A0896B', description: 'Tool storage shed',             canHoldPlants: false },
  { id: 'greenhouse',   name: 'Greenhouse',         emoji: '🪟', category: 'Utilities',  w: 8,  h: 6,  color: '#98FB98', borderColor: '#7CFC00', description: 'Full greenhouse',               canHoldPlants: true },
  // Paths
  { id: 'path_h',       name: 'Path (H)',           emoji: '🛤️', category: 'Paths',      w: 4,  h: 1,  color: '#D2B48C', borderColor: '#C4A882', description: 'Horizontal path section',       canHoldPlants: false },
  { id: 'path_v',       name: 'Path (V)',            emoji: '🛤️', category: 'Paths',      w: 1,  h: 4,  color: '#D2B48C', borderColor: '#C4A882', description: 'Vertical path section',         canHoldPlants: false },
  { id: 'stepping',     name: 'Stepping Stones',    emoji: '🪨', category: 'Paths',      w: 2,  h: 1,  color: '#A9A9A9', borderColor: '#808080', description: 'Stepping stone strip',          canHoldPlants: false },
]

// ─── Types ────────────────────────────────────────────────────────────
type PlacedImpl = {
  uid: string          // unique instance id
  defId: string        // which implement
  x: number; y: number // grid position in feet
  plants: PlacedPlant[]
  rotation: 0 | 90    // future use
}

type PlacedPlant = {
  uid: string
  plantId: string | null  // null = manual entry
  name: string
  emoji: string
  sqft: number
  x: number; y: number   // position within implement
  size: string
}

type UserPlant = {
  id: string; common_name: string; emoji: string; category: string; health_status: string
}

// ─── Grid Cell Size (px) ──────────────────────────────────────────────
const CELL = 44

// ─── Companion color hints ────────────────────────────────────────────
const COMPANION_LOVES: Record<string, string[]> = {
  tomato:     ['basil', 'marigold', 'carrot'],
  basil:      ['tomato', 'pepper'],
  carrot:     ['onion', 'rosemary', 'tomato'],
  marigold:   ['tomato', 'pepper', 'basil'],
  cucumber:   ['nasturtium', 'radish'],
  bean:       ['corn', 'squash', 'carrot'],
  corn:       ['bean', 'squash'],
  squash:     ['bean', 'corn', 'nasturtium'],
  rose:       ['garlic', 'lavender'],
  lettuce:    ['strawberry', 'chive'],
  pepper:     ['basil', 'carrot', 'marigold'],
}

function isCompanion(a: string, b: string): boolean {
  const al = a.toLowerCase(); const bl = b.toLowerCase()
  for (const [key, friends] of Object.entries(COMPANION_LOVES)) {
    if (al.includes(key) && friends.some(f => bl.includes(f))) return true
    if (bl.includes(key) && friends.some(f => al.includes(f))) return true
  }
  return false
}

// ─── Unique ID helper ─────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10)

// ─── Main Planner Component ───────────────────────────────────────────
export default function PlannerPage() {
  const supabase = createClient()
  const canvasRef = useRef<HTMLDivElement>(null)

  // Garden config
  const [gridW, setGridW] = useState(16)
  const [gridH, setGridH] = useState(12)
  const [gardenName, setGardenName] = useState('My Garden')
  const [buildId, setBuildId] = useState<string | null>(null)

  // Placed items
  const [placed, setPlaced] = useState<PlacedImpl[]>([])

  // UI state
  const [selectedImpl, setSelectedImpl]   = useState<PlacedImpl | null>(null)
  const [implTab, setImplTab]             = useState('Beds')
  const [sideTab, setSideTab]             = useState<'implements' | 'plants'>('implements')
  const [userPlants, setUserPlants]       = useState<UserPlant[]>([])
  const [saving, setSaving]               = useState(false)
  const [showGrid, setShowGrid]           = useState(true)
  const [showSetup, setShowSetup]         = useState(false)

  // Drag state
  const draggingImpl  = useRef<string | null>(null)  // defId being dragged from palette
  const draggingPlant = useRef<UserPlant | null>(null)
  const draggingManual = useRef<string | null>(null)   // manual plant name
  const ghostRef      = useRef<{ x: number; y: number } | null>(null)
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null)
  const [ghostDef, setGhostDef] = useState<ImplementDef | null>(null)
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null)

  // Load user's plants and existing build
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: plants }, { data: builds }] = await Promise.all([
        supabase.from('plants').select('id, common_name, emoji, category, health_status')
          .eq('user_id', user.id).eq('is_archived', false),
        supabase.from('garden_builds').select('*').eq('user_id', user.id)
          .order('updated_at', { ascending: false }).limit(1),
      ])

      setUserPlants(plants ?? [])

      if (builds && builds.length > 0) {
        const b = builds[0]
        setBuildId(b.id)
        setGardenName(b.name)
        setGridW(b.width_ft)
        setGridH(b.height_ft)
        setPlaced(b.grid_data ?? [])
      }
    }
    load()
  }, [])

  // ── Drag from palette (implement) ──────────────────────────────────
  function onImplDragStart(defId: string) {
    draggingImpl.current = defId
    draggingPlant.current = null
    const def = IMPLEMENTS.find(i => i.id === defId)!
    setGhostDef(def)
  }

  // ── Drag from plants panel ──────────────────────────────────────────
  function onPlantDragStart(plant: UserPlant) {
    draggingPlant.current = plant
    draggingImpl.current = null
    draggingManual.current = null
    setGhostDef(null)
  }

  // ── Canvas mouse events ────────────────────────────────────────────
  function getCellFromEvent(e: React.DragEvent<HTMLDivElement>): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: Math.floor((e.clientX - rect.left) / CELL),
      y: Math.floor((e.clientY - rect.top) / CELL),
    }
  }

  function onCanvasDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const cell = getCellFromEvent(e)
    setHoverCell(cell)
    setGhostPos(cell)
    ghostRef.current = cell
  }

  function onCanvasDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const cell = getCellFromEvent(e)
    setGhostPos(null)
    setHoverCell(null)

    if (draggingImpl.current) {
      const def = IMPLEMENTS.find(i => i.id === draggingImpl.current)
      if (!def) return
      // Clamp to grid
      const x = Math.max(0, Math.min(cell.x, gridW - def.w))
      const y = Math.max(0, Math.min(cell.y, gridH - def.h))
      const newItem: PlacedImpl = {
        uid: uid(), defId: def.id, x, y, plants: [], rotation: 0,
      }
      setPlaced(prev => [...prev, newItem])
      setSelectedImpl(newItem)
      draggingImpl.current = null
      setGhostDef(null)
    }
  }

  function onCanvasDragLeave() {
    setGhostPos(null)
    setHoverCell(null)
  }

  // ── Drop plant onto selected implement ────────────────────────────
  function onImplDropPlant(e: React.DragEvent<HTMLDivElement>, impl: PlacedImpl) {
    e.preventDefault()
    e.stopPropagation()
    const def = IMPLEMENTS.find(i => i.id === impl.defId)!
    if (!def.canHoldPlants) { toast.error(`${def.name} can't hold plants`); return }

    const plant = draggingPlant.current
    if (!plant) return

    const size = getPlantSize(plant.common_name)
    const sfg = SFG_SPACING[size]
    const capacity = def.w * def.h
    const usedSqft = impl.plants.reduce((s, p) => s + p.sqft, 0)

    if (usedSqft + sfg.sqft > capacity + 0.01) {
      toast.error(`No room! ${def.name} is full (${capacity} sq ft)`)
      return
    }
    if (def.maxPlants && impl.plants.length >= def.maxPlants) {
      toast.error(`Max ${def.maxPlants} plant(s) in this container`)
      return
    }

    const newPlant: PlacedPlant = {
      uid: uid(), plantId: plant.id, name: plant.common_name,
      emoji: plant.emoji ?? '🌿', sqft: sfg.sqft,
      x: 0, y: impl.plants.length, size,
    }

    setPlaced(prev => prev.map(p =>
      p.uid === impl.uid ? { ...p, plants: [...p.plants, newPlant] } : p
    ))
    setSelectedImpl(prev => prev?.uid === impl.uid
      ? { ...prev, plants: [...prev.plants, newPlant] } : prev
    )
    draggingPlant.current = null
  }

  // ── Remove implement ───────────────────────────────────────────────
  function removeImpl(implUid: string) {
    setPlaced(prev => prev.filter(p => p.uid !== implUid))
    if (selectedImpl?.uid === implUid) setSelectedImpl(null)
  }

  // ── Remove plant from implement ────────────────────────────────────
  function removePlant(implUid: string, plantUid: string) {
    setPlaced(prev => prev.map(p =>
      p.uid === implUid ? { ...p, plants: p.plants.filter(pl => pl.uid !== plantUid) } : p
    ))
    setSelectedImpl(prev => prev?.uid === implUid
      ? { ...prev, plants: prev.plants.filter(pl => pl.uid !== plantUid) } : prev
    )
  }

  // ── Save build ─────────────────────────────────────────────────────
  async function saveBuild() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    if (buildId) {
      await supabase.from('garden_builds').update({
        name: gardenName, width_ft: gridW, height_ft: gridH, grid_data: placed,
      }).eq('id', buildId)
    } else {
      const { data } = await supabase.from('garden_builds').insert({
        user_id: user.id, name: gardenName, width_ft: gridW,
        height_ft: gridH, grid_data: placed,
      }).select('id').single()
      if (data) {
        setBuildId(data.id)
        await supabase.rpc('award_xp', { p_user_id: user.id, p_amount: 30, p_multiplier: false })
      }
    }
    setSaving(false)
    toast.success('🌱 Garden saved! +30 XP')
  }

  // ── Companion analysis for selected implement ──────────────────────
  function companionAnalysis(impl: PlacedImpl) {
    const names = impl.plants.map(p => p.name)
    const pairs: string[] = []
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        if (isCompanion(names[i], names[j])) {
          pairs.push(`${names[i]} + ${names[j]} ✓`)
        }
      }
    }
    return pairs
  }

  // ── SFG capacity display ───────────────────────────────────────────
  function capacity(impl: PlacedImpl) {
    const def = IMPLEMENTS.find(i => i.id === impl.defId)!
    const total = def.w * def.h
    const used = impl.plants.reduce((s, p) => s + p.sqft, 0)
    const pct = Math.min(100, Math.round((used / total) * 100))
    return { total, used: Math.round(used * 10) / 10, pct }
  }

  const implCategories = [...new Set(IMPLEMENTS.map(i => i.category))]

  return (
    <div className="flex h-full bg-green-50/30 overflow-hidden">

      {/* ── LEFT SIDEBAR ──────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 bg-green-950 border-r border-green-900/50 flex flex-col overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-green-900/50">
          {(['implements', 'plants'] as const).map(t => (
            <button key={t} onClick={() => setSideTab(t)}
              className={`flex-1 py-2.5 text-xs font-body font-bold capitalize transition-colors
                ${sideTab === t ? 'bg-green-800/60 text-green-300' : 'text-green-600 hover:text-green-400'}`}>
              {t === 'implements' ? '🏗️ Items' : '🌿 Plants'}
            </button>
          ))}
        </div>

        {sideTab === 'implements' ? (
          <>
            {/* Category filter */}
            <div className="flex gap-1 p-2 flex-wrap">
              {implCategories.map(cat => (
                <button key={cat} onClick={() => setImplTab(cat)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-body font-bold transition-colors
                    ${implTab === cat ? 'bg-green-600 text-white' : 'bg-green-900/40 text-green-600 hover:text-green-400'}`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Implements list */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1.5">
              {IMPLEMENTS.filter(i => i.category === implTab).map(impl => (
                <div
                  key={impl.id}
                  draggable
                  onDragStart={() => onImplDragStart(impl.id)}
                  onDragEnd={() => { setGhostDef(null); setGhostPos(null) }}
                  className="flex items-center gap-2.5 bg-green-900/40 hover:bg-green-800/60 border border-green-800/30 hover:border-green-600/40 rounded-xl p-2.5 cursor-grab active:cursor-grabbing transition-all group"
                >
                  <span className="text-xl flex-shrink-0">{impl.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-green-200 text-xs font-body font-semibold truncate">{impl.name}</p>
                    <p className="text-green-600 text-[10px] font-body">{impl.w}×{impl.h} ft</p>
                  </div>
                  <span className="ml-auto text-green-700 group-hover:text-green-500 text-xs transition-colors">⠿</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-green-600 text-[10px] font-body font-bold uppercase tracking-wider px-3 pt-3 pb-1">
              Your Plants
            </p>
            <p className="text-green-700 text-[10px] font-body px-3 pb-2 leading-relaxed">
              Drag plants into a bed or pot on your canvas
            </p>
            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1.5">
              {userPlants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-green-700 text-xs font-body">No plants yet</p>
                  <p className="text-green-800 text-[10px] font-body mt-1">Add plants to your garden first</p>
                </div>
              ) : (
                userPlants.map(plant => (
                  <div
                    key={plant.id}
                    draggable
                    onDragStart={() => onPlantDragStart(plant)}
                    onDragEnd={() => { draggingPlant.current = null }}
                    className="flex items-center gap-2.5 bg-green-900/40 hover:bg-green-800/60 border border-green-800/30 hover:border-green-600/40 rounded-xl p-2.5 cursor-grab active:cursor-grabbing transition-all group"
                  >
                    <span className="text-xl flex-shrink-0">{plant.emoji ?? '🌿'}</span>
                    <div className="min-w-0">
                      <p className="text-green-200 text-xs font-body font-semibold truncate">{plant.common_name}</p>
                      <p className="text-green-600 text-[10px] font-body capitalize">{plant.health_status}</p>
                    </div>
                    <span className="ml-auto text-green-700 group-hover:text-green-500 text-xs">⠿</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </aside>

      {/* ── MAIN CANVAS AREA ──────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-green-100 flex-shrink-0">
          <Image src="/mascots/sproutdigging.png" alt="Sprout" width={28} height={28} className="flex-shrink-0" />
          <input
            value={gardenName}
            onChange={e => setGardenName(e.target.value)}
            className="font-display font-black text-green-ink text-lg bg-transparent outline-none border-b-2 border-transparent focus:border-green-500 transition-colors min-w-0 flex-1"
          />
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {/* Grid size */}
            <button
              onClick={() => setShowSetup(s => !s)}
              className={`text-xs font-body font-semibold px-3 py-1.5 rounded-lg border transition-colors
                ${showSetup ? 'bg-green-700 text-white border-green-600' : 'border-green-200 text-green-600 hover:border-green-400'}`}>
              {gridW}×{gridH} ft
            </button>
            {/* Toggle grid */}
            <button
              onClick={() => setShowGrid(s => !s)}
              className={`text-xs font-body font-semibold px-3 py-1.5 rounded-lg border transition-colors
                ${showGrid ? 'bg-green-100 border-green-300 text-green-700' : 'border-green-200 text-green-500'}`}>
              Grid
            </button>
            {/* Clear */}
            <button
              onClick={() => { if (confirm('Clear the whole garden?')) setPlaced([]) }}
              className="text-xs font-body font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors">
              Clear
            </button>
            {/* Save */}
            <button
              onClick={saveBuild}
              disabled={saving}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-body font-bold text-xs px-4 py-1.5 rounded-lg transition-all hover:-translate-y-px">
              {saving ? 'Saving...' : '💾 Save'}
            </button>
          </div>
        </div>

        {/* Grid size setup panel */}
        {showSetup && (
          <div className="flex items-center gap-4 px-4 py-2 bg-green-50 border-b border-green-200 text-sm font-body">
            <span className="text-green-700 font-semibold text-xs">Garden Size:</span>
            <div className="flex items-center gap-2">
              <label className="text-green-600 text-xs">Width (ft)</label>
              <input type="number" value={gridW} min={4} max={40}
                onChange={e => setGridW(parseInt(e.target.value) || 16)}
                className="w-16 border border-green-300 rounded-lg px-2 py-1 text-xs text-center" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-green-600 text-xs">Height (ft)</label>
              <input type="number" value={gridH} min={4} max={40}
                onChange={e => setGridH(parseInt(e.target.value) || 12)}
                className="w-16 border border-green-300 rounded-lg px-2 py-1 text-xs text-center" />
            </div>
            <span className="text-green-500 text-xs">{gridW * gridH} sq ft total</span>
            <button onClick={() => setShowSetup(false)} className="ml-auto text-green-500 hover:text-green-700 text-xs">Done</button>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-4 bg-stone-100">
          <div
            className="relative inline-block bg-stone-200 rounded-xl shadow-inner border-2 border-stone-300"
            style={{
              width: gridW * CELL,
              height: gridH * CELL,
              backgroundImage: showGrid
                ? `repeating-linear-gradient(#b5b0a8 0px, transparent 1px, transparent ${CELL}px),
                   repeating-linear-gradient(90deg, #b5b0a8 0px, transparent 1px, transparent ${CELL}px)`
                : 'none',
              backgroundSize: `${CELL}px ${CELL}px`,
            }}
            ref={canvasRef}
            onDragOver={onCanvasDragOver}
            onDrop={onCanvasDrop}
            onDragLeave={onCanvasDragLeave}
            onClick={() => setSelectedImpl(null)}
          >
            {/* Foot ruler - top */}
            <div className="absolute -top-5 left-0 flex">
              {[...Array(gridW)].map((_, i) => (
                <div key={i} style={{ width: CELL }}
                  className="text-center text-[9px] text-stone-400 font-mono">{i + 1}</div>
              ))}
            </div>
            {/* Foot ruler - left */}
            <div className="absolute -left-5 top-0 flex flex-col">
              {[...Array(gridH)].map((_, i) => (
                <div key={i} style={{ height: CELL }}
                  className="flex items-center justify-center text-[9px] text-stone-400 font-mono">{i + 1}</div>
              ))}
            </div>

            {/* Drop ghost */}
            {ghostPos && ghostDef && (
              <div
                className="absolute pointer-events-none rounded-lg opacity-60 border-2 border-dashed border-white transition-all"
                style={{
                  left: Math.max(0, Math.min(ghostPos.x, gridW - ghostDef.w)) * CELL,
                  top:  Math.max(0, Math.min(ghostPos.y, gridH - ghostDef.h)) * CELL,
                  width:  ghostDef.w * CELL,
                  height: ghostDef.h * CELL,
                  backgroundColor: ghostDef.color + 'aa',
                }}
              />
            )}

            {/* Placed implements */}
            {placed.map(impl => {
              const def = IMPLEMENTS.find(i => i.id === impl.defId)!
              if (!def) return null
              const isSelected = selectedImpl?.uid === impl.uid
              const cap = capacity(impl)

              return (
                <div
                  key={impl.uid}
                  className={`absolute rounded-lg flex flex-col items-start justify-start overflow-hidden cursor-pointer transition-all
                    ${isSelected ? 'ring-2 ring-white ring-offset-1 shadow-lg z-20' : 'hover:ring-1 hover:ring-white/50 z-10'}`}
                  style={{
                    left: impl.x * CELL,
                    top:  impl.y * CELL,
                    width:  def.w * CELL,
                    height: def.h * CELL,
                    backgroundColor: def.color,
                    border: `2px solid ${def.borderColor}`,
                  }}
                  onClick={e => { e.stopPropagation(); setSelectedImpl(impl) }}
                  onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                  onDrop={e => onImplDropPlant(e, impl)}
                >
                  {/* Implement header */}
                  <div className="flex items-center gap-1 px-1.5 pt-1 w-full">
                    <span className="text-sm leading-none">{def.emoji}</span>
                    {def.w >= 4 && (
                      <span className="text-white/80 text-[9px] font-body font-bold truncate flex-1">{def.name}</span>
                    )}
                    {def.canHoldPlants && cap.pct > 0 && (
                      <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full ml-auto
                        ${cap.pct >= 100 ? 'bg-red-500 text-white' : cap.pct >= 75 ? 'bg-amber-400 text-green-ink' : 'bg-green-400 text-green-ink'}`}>
                        {cap.pct}%
                      </span>
                    )}
                  </div>

                  {/* Plants inside */}
                  <div className="flex flex-wrap gap-0.5 px-1.5 pt-0.5">
                    {impl.plants.map(plant => (
                      <div
                        key={plant.uid}
                        className="flex items-center gap-0.5 bg-black/20 rounded px-1 py-0.5 cursor-pointer hover:bg-red-500/40 transition-colors group"
                        onClick={e => { e.stopPropagation(); removePlant(impl.uid, plant.uid) }}
                        title={`${plant.name} — click to remove`}
                      >
                        <span className="text-xs leading-none">{plant.emoji}</span>
                        {def.w >= 3 && (
                          <span className="text-white/90 text-[8px] font-body font-semibold group-hover:text-red-200 truncate max-w-[48px]">
                            {plant.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Drop zone hint when selected and empty */}
                  {isSelected && def.canHoldPlants && impl.plants.length === 0 && (
                    <div className="flex-1 flex items-center justify-center w-full opacity-40">
                      <span className="text-white text-[9px] font-body text-center">
                        Drop plants{'\n'}from panel
                      </span>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Empty state */}
            {placed.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Image src="/mascots/sproutdigging.png" alt="Sprout" width={64} height={64} className="opacity-30 mb-3" />
                <p className="text-stone-400 font-body text-sm text-center">
                  Drag items from the left panel<br />to start building your garden
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── RIGHT PANEL — selected implement detail ────────────────── */}
      {selectedImpl && (() => {
        const def = IMPLEMENTS.find(i => i.id === selectedImpl.defId)!
        const cap = capacity(selectedImpl)
        const companions = companionAnalysis(selectedImpl)
        return (
          <aside className="w-56 flex-shrink-0 bg-white border-l border-green-100 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-green-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">{def.emoji}</span>
                <button
                  onClick={() => removeImpl(selectedImpl.uid)}
                  className="text-red-400 hover:text-red-600 text-xs font-body font-bold transition-colors">
                  Remove
                </button>
              </div>
              <h3 className="font-display font-black text-green-ink text-base">{def.name}</h3>
              <p className="text-green-600 text-xs font-body">{def.description}</p>
            </div>

            {def.canHoldPlants && (
              <>
                {/* Capacity bar */}
                <div className="px-4 py-3 border-b border-green-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-green-600 text-xs font-body font-bold">SFG Capacity</span>
                    <span className="text-green-ink text-xs font-body font-bold">{cap.used}/{cap.total} sq ft</span>
                  </div>
                  <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300
                        ${cap.pct >= 100 ? 'bg-red-500' : cap.pct >= 75 ? 'bg-amber-400' : 'bg-green-500'}`}
                      style={{ width: `${cap.pct}%` }}
                    />
                  </div>
                  <p className="text-green-700 text-[10px] font-body mt-1">
                    {cap.pct < 100
                      ? `${cap.total - cap.used} sq ft available`
                      : '🚫 Full — remove a plant to add more'}
                  </p>
                </div>

                {/* Plants list */}
                <div className="flex-1 overflow-y-auto px-4 py-2">
                  <p className="text-green-600 text-[10px] font-body font-bold uppercase tracking-wider mb-2">
                    Plants ({selectedImpl.plants.length})
                  </p>
                  {selectedImpl.plants.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-green-400 text-xs font-body">No plants yet</p>
                      <p className="text-green-300 text-[10px] font-body mt-1">Drag from the Plants tab</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedImpl.plants.map(plant => {
                        const sfg = SFG_SPACING[plant.size]
                        return (
                          <div key={plant.uid} className="flex items-center gap-2 bg-green-50 rounded-lg px-2 py-1.5">
                            <span className="text-base">{plant.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-green-ink text-xs font-body font-semibold truncate">{plant.name}</p>
                              <p className="text-green-500 text-[10px] font-body">{sfg.label}</p>
                            </div>
                            <button
                              onClick={() => removePlant(selectedImpl.uid, plant.uid)}
                              className="text-red-300 hover:text-red-500 text-xs font-bold transition-colors"
                              title="Remove">×</button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Companion analysis */}
                {companions.length > 0 && (
                  <div className="px-4 py-3 border-t border-green-100 bg-green-50">
                    <p className="text-green-700 text-[10px] font-body font-bold uppercase tracking-wider mb-1.5">
                      ✨ Good Companions
                    </p>
                    {companions.map(pair => (
                      <p key={pair} className="text-green-600 text-[10px] font-body">{pair}</p>
                    ))}
                  </div>
                )}

                {/* SFG hint */}
                <div className="px-4 py-3 border-t border-green-100">
                  <p className="text-green-500 text-[10px] font-body leading-relaxed">
                    <strong className="text-green-600">Square Foot Gardening:</strong> large plants 1/sq ft · medium 4/sq ft · small 9/sq ft · herbs 16/sq ft
                  </p>
                </div>
              </>
            )}
          </aside>
        )
      })()}

      {/* No selection hint */}
      {!selectedImpl && (
        <aside className="w-56 flex-shrink-0 bg-white border-l border-green-100 flex flex-col items-center justify-center p-6 text-center">
          <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={56} height={56} className="mb-3 opacity-40" />
          <p className="text-green-400 text-xs font-body leading-relaxed">
            Click any item on the canvas to see details, manage plants, and check companion compatibility
          </p>
          <div className="mt-4 text-left w-full">
            <p className="text-green-600 text-[10px] font-body font-bold uppercase tracking-wider mb-2">Quick Guide</p>
            <div className="space-y-1.5">
              {[
                ['1.', 'Drag items from the left panel onto the grid'],
                ['2.', 'Switch to Plants tab to drag your plants in'],
                ['3.', 'Click an item to see SFG capacity'],
                ['4.', 'Click a plant inside to remove it'],
                ['5.', "Save when you're happy with the layout"],
              ].map(([n, t]) => (
                <p key={n} className="text-green-500 text-[10px] font-body">
                  <span className="font-bold text-green-600">{n}</span> {t}
                </p>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
