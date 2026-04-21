'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// ─── Species catalogue (now includes fish) ───────────────────────────
const SPECIES = [
  // Birds
  { id: 'chicken', label: 'Chicken',     emoji: '🐓', produce: 'eggs',    housing: 'coop',       category: 'Birds',      description: 'Eggs, pest control, fertilizer' },
  { id: 'duck',    label: 'Duck',        emoji: '🦆', produce: 'eggs',    housing: 'pen',        category: 'Birds',      description: 'Eggs, slug control, pond companion' },
  { id: 'quail',   label: 'Quail',       emoji: '🪺', produce: 'eggs',    housing: 'coop',       category: 'Birds',      description: 'Tiny eggs, small-space friendly' },
  { id: 'turkey',  label: 'Turkey',      emoji: '🦃', produce: 'meat',    housing: 'pen',        category: 'Birds',      description: 'Meat, insect control' },
  { id: 'goose',   label: 'Goose',       emoji: '🪿', produce: 'eggs',    housing: 'pen',        category: 'Birds',      description: 'Eggs, grass control, guardian' },
  // Mammals
  { id: 'goat',    label: 'Goat',        emoji: '🐐', produce: 'milk',    housing: 'pen',        category: 'Mammals',    description: 'Milk, brush clearing, fiber' },
  { id: 'rabbit',  label: 'Rabbit',      emoji: '🐇', produce: 'manure',  housing: 'hutch',      category: 'Mammals',    description: 'Best garden manure, meat, fiber' },
  { id: 'pig',     label: 'Pig',         emoji: '🐷', produce: 'meat',    housing: 'pen',        category: 'Mammals',    description: 'Meat, tilling, composting' },
  { id: 'sheep',   label: 'Sheep',       emoji: '🐑', produce: 'fiber',   housing: 'pasture',    category: 'Mammals',    description: 'Wool, milk, meat, grazing' },
  // Insects & Bees
  { id: 'bee',     label: 'Honeybee',    emoji: '🐝', produce: 'honey',   housing: 'hive',       category: 'Insects',    description: 'Honey, wax, pollination' },
  // Fish & Aquatic
  { id: 'koi',          label: 'Koi',          emoji: '🐠', produce: 'fertilizer', housing: 'pond',  category: 'Fish',  description: 'Ornamental pond fish, fertilized water' },
  { id: 'goldfish',     label: 'Goldfish',     emoji: '🐟', produce: 'fertilizer', housing: 'pond',  category: 'Fish',  description: 'Hardy pond/tank fish, aquaponics friendly' },
  { id: 'tilapia',      label: 'Tilapia',      emoji: '🐡', produce: 'meat',        housing: 'tank', category: 'Fish',  description: 'Best aquaponics fish. Fast growing, edible.' },
  { id: 'trout',        label: 'Trout',        emoji: '🐟', produce: 'meat',        housing: 'tank', category: 'Fish',  description: 'Cold water aquaponics. Premium edible fish.' },
  { id: 'catfish',      label: 'Catfish',      emoji: '🐡', produce: 'meat',        housing: 'pond', category: 'Fish',  description: 'Hardy pond fish. Edible, low maintenance.' },
  { id: 'bass',         label: 'Bass',         emoji: '🐟', produce: 'meat',        housing: 'pond', category: 'Fish',  description: 'Sport and food fish. Good aquaponics option.' },
  { id: 'perch',        label: 'Yellow Perch', emoji: '🐟', produce: 'meat',        housing: 'tank', category: 'Fish',  description: 'Excellent aquaponics fish. Cold tolerant.' },
  { id: 'carp',         label: 'Carp',         emoji: '🐠', produce: 'fertilizer',  housing: 'pond', category: 'Fish',  description: 'Traditional pond fish. Great water fertilizer.' },
  { id: 'other',   label: 'Other',       emoji: '🐾', produce: 'other',   housing: 'other',      category: 'Other',      description: 'Custom animal or species' },
]

const CATEGORIES = ['Birds', 'Mammals', 'Insects', 'Fish', 'Other']

const HEALTH_STYLE: Record<string, { dot: string; badge: string; label: string }> = {
  healthy:         { dot: 'bg-green-400',                  badge: 'bg-green-800/60 text-green-300',  label: 'Healthy' },
  thriving:        { dot: 'bg-green-400',                  badge: 'bg-green-800/60 text-green-300',  label: 'Thriving 💚' },
  needs_attention: { dot: 'bg-amber-400 animate-pulse',    badge: 'bg-amber-900/60 text-amber-300',  label: 'Needs Attention ⚠️' },
  alert:           { dot: 'bg-red-500 animate-pulse',      badge: 'bg-red-900/60 text-red-300',      label: 'Alert 🚨' },
}

type Animal = {
  id: string; species: string; breed: string | null; name: string | null
  emoji: string; count: number; health_status: string; age_months: number | null
  housing_type: string | null; produce_type: string | null
  feed_lbs_per_day: number | null; is_producer: boolean; notes: string | null
}

type Synergy = {
  plant_name: string; synergy_type: string; benefit: string; sqft_per_animal: number | null
}

type Log = {
  id: string; log_type: string; quantity: number | null; unit: string | null
  notes: string | null; logged_at: string
}

// ─── Add Animal Modal ─────────────────────────────────────────────────
function AddAnimalModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const supabase = createClient()
  const [step,    setStep]    = useState<'category' | 'species' | 'details'>('category')
  const [cat,     setCat]     = useState<string | null>(null)
  const [species, setSpecies] = useState<typeof SPECIES[0] | null>(null)
  const [name,    setName]    = useState('')
  const [breed,   setBreed]   = useState('')
  const [count,   setCount]   = useState('1')
  const [ageMo,   setAgeMo]   = useState('')
  const [aqua,    setAqua]    = useState(false)   // is aquaponics system?
  const [saving,  setSaving]  = useState(false)

  const filteredSpecies = SPECIES.filter(s => s.category === cat)
  const isFish = species?.category === 'Fish'

  async function handleAdd() {
    if (!species) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const housingType = isFish && aqua ? 'aquaponics' : species.housing

    const { error } = await supabase.from('sprout_animals').insert({
      user_id:       user.id,
      species:       species.id,
      breed:         breed || null,
      name:          name || null,
      emoji:         species.emoji,
      count:         parseInt(count) || 1,
      produce_type:  species.produce,
      housing_type:  housingType,
      age_months:    ageMo ? parseInt(ageMo) : null,
      health_status: 'healthy',
      zone_notes:    isFish && aqua ? 'Aquaponics system — fish waste fertilizes plants directly.' : null,
    })

    if (error) { toast.error('Could not add animal'); setSaving(false); return }
    await supabase.rpc('sprout_award_xp', { p_user_id: user.id, p_amount: 50, p_multiplier: false })
    toast.success(`${species.emoji} ${species.label} added! +50 XP`)
    onAdded(); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-green-950 border border-green-800/50 rounded-2xl shadow-sprout-xl overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-green-900/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{species?.emoji ?? '🐾'}</span>
            <div>
              <h2 className="font-display text-white font-black text-lg leading-tight">
                {step === 'category' ? 'What are you raising?' : step === 'species' ? cat : `Add ${species?.label}`}
              </h2>
              <p className="text-green-600 text-xs font-body">
                {step === 'category' ? 'Choose a category' : step === 'species' ? 'Pick the species' : 'Tell Sprout about them'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-green-600 hover:text-green-400 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-900/40">×</button>
        </div>

        <div className="p-5 max-h-[72vh] overflow-y-auto">

          {/* Step 1: Category */}
          {step === 'category' && (
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(c => {
                const specs = SPECIES.filter(s => s.category === c)
                const emojis = specs.slice(0, 3).map(s => s.emoji).join(' ')
                return (
                  <button key={c} onClick={() => { setCat(c); setStep('species') }}
                    className="flex flex-col items-start gap-2 bg-green-900/40 hover:bg-green-800/60 border border-green-800/30 hover:border-green-600/40 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 group">
                    <span className="text-2xl">{emojis}</span>
                    <p className="text-green-200 text-sm font-body font-bold">{c}</p>
                    <p className="text-green-600 text-[10px] font-body group-hover:text-green-400">
                      {specs.map(s => s.label).join(', ')}
                    </p>
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 2: Species */}
          {step === 'species' && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {filteredSpecies.map(s => (
                  <button key={s.id} onClick={() => { setSpecies(s); setStep('details') }}
                    className="flex flex-col items-start gap-1.5 bg-green-900/40 hover:bg-green-800/60 border border-green-800/30 hover:border-green-600/40 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 group">
                    <span className="text-3xl">{s.emoji}</span>
                    <p className="text-green-200 text-sm font-body font-bold">{s.label}</p>
                    <p className="text-green-600 text-[10px] font-body leading-snug group-hover:text-green-400">{s.description}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep('category')} className="text-green-600 hover:text-green-400 text-xs font-body font-semibold transition-colors">← Back</button>
            </>
          )}

          {/* Step 3: Details */}
          {step === 'details' && species && (
            <div className="space-y-4">
              <div className="bg-green-900/30 border border-green-800/30 rounded-xl p-3">
                <p className="text-green-400 text-xs font-body leading-relaxed">
                  <strong className="text-green-300">{species.emoji} {species.label}</strong> — {species.description}
                </p>
              </div>

              {/* Aquaponics toggle for fish */}
              {isFish && (
                <div className="bg-sky-900/30 border border-sky-800/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sky-300 text-sm font-body font-bold">Aquaponics System?</p>
                      <p className="text-sky-600 text-xs font-body">Fish water fertilizes your plants directly</p>
                    </div>
                    <button onClick={() => setAqua(a => !a)}
                      className={`w-12 h-6 rounded-full transition-all ${aqua ? 'bg-sky-500' : 'bg-green-900'}`}>
                      <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${aqua ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  {aqua && (
                    <div className="mt-2 space-y-1">
                      {['Lettuce', 'Basil', 'Tomatoes', 'Kale', 'Watercress'].map(p => (
                        <p key={p} className="text-sky-500 text-[10px] font-body">✓ {p} thrives in your fish water</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Count */}
              <div>
                <label className="text-green-400 text-xs font-body font-bold uppercase tracking-wide block mb-1.5">
                  {isFish ? 'How many fish?' : 'How many?'}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(isFish ? ['5','10','20','50','100'] : ['1','2','3','4','5','6','10','12']).map(n => (
                    <button key={n} onClick={() => setCount(n)}
                      className={`flex-1 min-w-[2.5rem] py-2 rounded-lg text-xs font-body font-semibold border transition-all
                        ${count === n ? 'bg-green-600 text-white border-green-500' : 'bg-green-950/40 text-green-500 border-green-800/40 hover:border-green-600'}`}>
                      {n}
                    </button>
                  ))}
                </div>
                <input value={count} onChange={e => setCount(e.target.value.replace(/\D/, ''))}
                  placeholder="Or type exact number"
                  className="w-full mt-2 bg-green-950/60 border border-green-700/50 text-white placeholder-green-700 font-body text-sm px-3 py-2 rounded-xl outline-none focus:border-green-400 transition-colors" />
              </div>

              {/* Breed */}
              <div>
                <label className="text-green-400 text-xs font-body font-bold uppercase tracking-wide block mb-1.5">
                  {isFish ? 'Variety (optional)' : 'Breed (optional)'}
                </label>
                <input value={breed} onChange={e => setBreed(e.target.value)}
                  placeholder={
                    species.id === 'chicken' ? 'e.g. Rhode Island Red, Leghorn...' :
                    species.id === 'goat'    ? 'e.g. Nubian, Nigerian Dwarf...' :
                    species.id === 'koi'     ? 'e.g. Kohaku, Showa, Butterfly...' :
                    species.id === 'tilapia' ? 'e.g. Nile, Blue, Mozambique...' :
                    'breed or variety if known'
                  }
                  className="w-full bg-green-950/60 border border-green-700/50 text-white placeholder-green-700 font-body text-sm px-3 py-2.5 rounded-xl outline-none focus:border-green-400 transition-colors" />
              </div>

              {/* Name */}
              <div>
                <label className="text-green-400 text-xs font-body font-bold uppercase tracking-wide block mb-1.5">
                  {isFish ? 'Pond / tank name (optional)' : 'Name or flock name (optional)'}
                </label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder={isFish ? 'e.g. Back Pond, Aquaponics Tank A...' : 'e.g. The Girls, Henrietta, Flock A...'}
                  className="w-full bg-green-950/60 border border-green-700/50 text-white placeholder-green-700 font-body text-sm px-3 py-2.5 rounded-xl outline-none focus:border-green-400 transition-colors" />
              </div>

              {/* Age */}
              {!isFish && (
                <div>
                  <label className="text-green-400 text-xs font-body font-bold uppercase tracking-wide block mb-1.5">Age in months (optional)</label>
                  <input value={ageMo} onChange={e => setAgeMo(e.target.value.replace(/\D/, ''))} placeholder="e.g. 6"
                    className="w-full bg-green-950/60 border border-green-700/50 text-white placeholder-green-700 font-body text-sm px-3 py-2.5 rounded-xl outline-none focus:border-green-400 transition-colors" />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep('species')}
                  className="flex-1 border border-green-800 text-green-500 font-body font-semibold py-3 rounded-xl text-sm hover:border-green-600 transition-colors">
                  ← Back
                </button>
                <button onClick={handleAdd} disabled={saving || parseInt(count) < 1}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-body font-bold py-3 rounded-xl text-sm transition-all hover:-translate-y-px">
                  {saving ? 'Adding...' : `Add ${species.emoji} +50 XP`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Log Modal ────────────────────────────────────────────────────────
function LogModal({ animal, onClose, onLogged }: { animal: Animal; onClose: () => void; onLogged: () => void }) {
  const supabase = createClient()
  const isFish = ['koi','goldfish','tilapia','trout','catfish','bass','perch','carp','fish'].includes(animal.species)
  const [logType, setLogType] = useState<'production'|'feed'|'health'|'note'>('production')
  const [qty,     setQty]     = useState('')
  const [unit,    setUnit]    = useState(
    isFish ? 'gallons' :
    animal.produce_type === 'eggs' ? 'eggs' :
    animal.produce_type === 'milk' ? 'gallons' :
    animal.produce_type === 'honey' ? 'frames' : 'lbs'
  )
  const [notes,   setNotes]   = useState('')
  const [saving,  setSaving]  = useState(false)

  const LOG_TYPES = [
    { id: 'production', emoji: isFish ? '💧' : animal.produce_type === 'eggs' ? '🥚' : animal.produce_type === 'milk' ? '🥛' : animal.produce_type === 'honey' ? '🍯' : '📦',
      label: isFish ? 'Water/Harvest' : 'Production' },
    { id: 'feed',   emoji: '🌾', label: 'Feed' },
    { id: 'health', emoji: '🩺', label: 'Health' },
    { id: 'note',   emoji: '📝', label: 'Note' },
  ]

  async function handleLog() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await supabase.from('sprout_animal_logs').insert({
      user_id: user.id, animal_id: animal.id, log_type: logType,
      quantity: qty ? parseFloat(qty) : null, unit: unit || null,
      notes: notes || null, xp_earned: logType === 'production' ? 25 : 5,
    })
    await supabase.rpc('sprout_award_xp', { p_user_id: user.id, p_amount: logType === 'production' ? 25 : 5, p_multiplier: false })
    toast.success(`Logged! +${logType === 'production' ? 25 : 5} XP`)
    onLogged(); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm bg-green-950 border border-green-800/50 rounded-2xl shadow-sprout-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-green-900/50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{animal.emoji}</span>
            <h3 className="font-display text-white font-black text-base">Log Entry</h3>
          </div>
          <button onClick={onClose} className="text-green-600 hover:text-green-400 text-xl font-bold w-8 h-8 flex items-center justify-center">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            {LOG_TYPES.map(t => (
              <button key={t.id} onClick={() => setLogType(t.id as any)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-body font-semibold transition-all
                  ${logType === t.id ? 'bg-green-700 text-white border-green-600' : 'border-green-800/40 text-green-500 hover:border-green-600'}`}>
                <span>{t.emoji}</span>{t.label}
              </button>
            ))}
          </div>
          {(logType === 'production' || logType === 'feed') && (
            <div className="flex gap-2">
              <input value={qty} onChange={e => setQty(e.target.value)} placeholder="Quantity"
                className="flex-1 bg-green-950/60 border border-green-700/50 text-white placeholder-green-700 font-body text-sm px-3 py-2.5 rounded-xl outline-none focus:border-green-400" />
              <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Unit"
                className="w-24 bg-green-950/60 border border-green-700/50 text-white placeholder-green-700 font-body text-sm px-3 py-2.5 rounded-xl outline-none focus:border-green-400" />
            </div>
          )}
          {/* Aquaponics water log hint */}
          {isFish && logType === 'production' && (
            <div className="bg-sky-900/30 border border-sky-800/30 rounded-xl p-3">
              <p className="text-sky-400 text-xs font-body">💧 Log gallons pumped to garden beds as fertilized water</p>
            </div>
          )}
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)..." rows={2}
            className="w-full bg-green-950/60 border border-green-700/50 text-white placeholder-green-700 font-body text-sm px-3 py-2.5 rounded-xl outline-none focus:border-green-400 resize-none" />
          <button onClick={handleLog} disabled={saving}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-body font-bold py-3 rounded-xl text-sm transition-all">
            {saving ? 'Saving...' : 'Save Log ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Animal Chat ──────────────────────────────────────────────────────
function AnimalChat({ animal, onClose }: { animal: Animal; onClose: () => void }) {
  const supabase  = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<{ id: string; role: string; content: string }[]>([])
  const [input,    setInput]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase.from('sprout_animal_chat').select('*').eq('animal_id', animal.id)
      .order('created_at', { ascending: true }).limit(30)
      .then(({ data }) => { setMessages(data ?? []); setLoading(false) })
  }, [animal.id])

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messages])

  async function send(text: string) {
    if (!text.trim() || sending) return
    setSending(true); setInput('')
    const tempId = Date.now().toString()
    setMessages(prev => [...prev,
      { id: tempId, role: 'user', content: text },
      { id: `t-${tempId}`, role: 'assistant', content: '...' },
    ])
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not signed in')
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sprout-ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ animal_id: animal.id, animal_species: animal.species, message: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessages(prev => prev.filter(m => m.id !== `t-${tempId}`)
        .concat({ id: `ai-${tempId}`, role: 'assistant', content: data.message }))
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== `t-${tempId}`))
      toast.error(err.message)
    } finally { setSending(false) }
  }

  const isFish = ['koi','goldfish','tilapia','trout','catfish','bass','perch','carp'].includes(animal.species)
  const QUICK = isFish
    ? ['Water quality tips?', 'Best aquaponics plants?', 'Feeding schedule?', 'Signs of disease?', 'How to recycle water to garden?']
    : animal.species === 'chicken'
    ? ['How many eggs should I expect?', 'What plants reduce feed costs?', 'Signs of illness?', 'Coop setup tips?']
    : animal.species === 'bee'
    ? ['Best plants to grow nearby?', 'When to inspect the hive?', 'Signs of disease?', 'When can I harvest honey?']
    : ['Care tips?', 'What plants help?', 'Signs of illness?', 'Feed schedule?']

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md h-[70vh] bg-green-950 border border-green-800/50 rounded-2xl shadow-sprout-xl flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-green-900/50 flex-shrink-0">
          <span className="text-2xl">{animal.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-white font-black text-base leading-tight">
              {animal.name ?? `${animal.count} ${animal.species}${animal.count > 1 ? 's' : ''}`}
            </h3>
            <p className="text-green-500 text-xs font-body capitalize">
              {animal.breed ?? animal.species}{animal.housing_type === 'aquaponics' ? ' · Aquaponics' : ''}
            </p>
          </div>
          <Image src="/mascots/sproutsmiling.png" alt="" width={28} height={28} className="opacity-70" />
          <button onClick={onClose} className="text-green-600 hover:text-green-400 text-xl font-bold w-8 h-8 flex items-center justify-center">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-green-950/50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-7 h-7 border-2 border-green-600/30 border-t-green-500 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={60} height={60} className="mb-3 animate-bob" />
              <p className="text-green-400 font-body text-sm font-semibold mb-1">Ask me anything!</p>
              <p className="text-green-700 font-body text-xs max-w-xs">
                {isFish
                  ? "I know aquaponics, water quality, and which plants thrive on your fish water."
                  : `I know your ${animal.species}s, your zone, and what to grow to cut your feed costs.`}
              </p>
            </div>
          ) : messages.map(m => (
            <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && <Image src="/mascots/sproutsmiling.png" alt="" width={24} height={24} className="flex-shrink-0 mt-1 rounded-full" />}
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm font-body leading-relaxed
                ${m.role === 'user' ? 'bg-green-700 text-white rounded-tr-sm' :
                  m.content === '...' ? 'bg-green-900/60 text-green-400 rounded-tl-sm' :
                  'bg-green-900/40 border border-green-800/40 text-green-100 rounded-tl-sm'}`}>
                {m.content === '...'
                  ? <span className="flex gap-1">{[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse-dot" style={{ animationDelay: `${i*0.2}s` }} />)}</span>
                  : m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {messages.length < 3 && (
          <div className="flex gap-1.5 px-4 py-2 overflow-x-auto flex-shrink-0 border-t border-green-900/50">
            {QUICK.map(q => (
              <button key={q} onClick={() => send(q)} disabled={sending}
                className="flex-shrink-0 text-[11px] font-body font-semibold text-green-500 border border-green-800/40 bg-green-900/30 hover:bg-green-800/40 px-2.5 py-1.5 rounded-full transition-colors whitespace-nowrap">
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="px-4 py-3 border-t border-green-900/50 flex gap-2 flex-shrink-0">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder={isFish ? `Ask about your ${animal.species}...` : `Ask about your ${animal.species}s...`}
            className="flex-1 bg-green-900/40 border border-green-800/40 text-white placeholder-green-700 font-body text-sm px-4 py-2.5 rounded-xl outline-none focus:border-green-500 transition-colors" />
          <button onClick={() => send(input)} disabled={!input.trim() || sending}
            className="bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-all flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.903 6.557H13.5a.75.75 0 010 1.5H4.182l-1.903 6.557a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Synergy Panel ────────────────────────────────────────────────────
function SynergyPanel({ animal }: { animal: Animal }) {
  const supabase = createClient()
  const [synergies,  setSynergies]  = useState<Synergy[]>([])
  const [userPlants, setUserPlants] = useState<string[]>([])
  const isFish = ['koi','goldfish','tilapia','trout','catfish','bass','perch','carp','fish'].includes(animal.species)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: syn }, { data: plants }] = await Promise.all([
        supabase.from('sprout_plant_animal_synergies').select('*')
          .ilike('animal_species', `%${animal.species}%`).order('synergy_type'),
        supabase.from('sprout_plants').select('common_name').eq('user_id', user.id).eq('is_archived', false),
      ])
      setSynergies(syn ?? [])
      setUserPlants((plants ?? []).map((p: any) => p.common_name.toLowerCase()))
    }
    load()
  }, [animal.id])

  const owned   = synergies.filter(s => userPlants.some(p => p.includes(s.plant_name.toLowerCase()) || s.plant_name.toLowerCase().includes(p)))
  const canGrow = synergies.filter(s => !owned.includes(s) && s.synergy_type !== 'manure_benefit')
  const benefits = synergies.filter(s => s.synergy_type === 'manure_benefit')

  const typeIcon: Record<string, string> = {
    fodder: isFish ? '💧' : '🌾', pest_control: '🛡️', habitat: '🌸',
    manure_benefit: '♻️', avoid: '⚠️'
  }

  return (
    <div className="space-y-4">
      {/* Aquaponics water recycling banner */}
      {isFish && (
        <div className="bg-sky-900/30 border border-sky-700/30 rounded-xl p-3">
          <p className="text-sky-300 text-xs font-body font-bold mb-1">💧 Aquaponics Water Cycle</p>
          <p className="text-sky-500 text-[10px] font-body leading-relaxed">
            Your fish waste water = liquid fertilizer. Run it to raised beds, save 100% on liquid feed costs for those plants.
          </p>
        </div>
      )}

      {owned.length > 0 && (
        <div>
          <p className="text-green-400 text-xs font-body font-bold uppercase tracking-wider mb-2">✅ Already Growing</p>
          <div className="space-y-2">
            {owned.map((s, i) => (
              <div key={i} className="bg-green-800/30 border border-green-700/30 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{typeIcon[s.synergy_type] ?? '🌿'}</span>
                  <span className="text-green-200 text-xs font-body font-bold">{s.plant_name}</span>
                  {s.sqft_per_animal && s.sqft_per_animal > 0 && (
                    <span className="ml-auto text-green-600 text-[10px] font-body">{s.sqft_per_animal * animal.count} sq ft total</span>
                  )}
                </div>
                <p className="text-green-500 text-[11px] font-body leading-relaxed">{s.benefit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {canGrow.length > 0 && (
        <div>
          <p className="text-amber-800 text-xs font-body font-bold uppercase tracking-wider mb-2">
            {isFish ? '💧 Best Plants for Your Fish Water' : '💡 Plant These to Cut Feed Costs'}
          </p>
          <div className="space-y-2">
            {canGrow.slice(0, 6).map((s, i) => (
              <div key={i} className="bg-amber-900/20 border border-amber-800/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{typeIcon[s.synergy_type] ?? '🌿'}</span>
                  <span className="text-amber-900 text-xs font-body font-bold">{s.plant_name}</span>
                  {s.sqft_per_animal && s.sqft_per_animal > 0 && (
                    <span className="ml-auto text-amber-900 text-[10px] font-body">{s.sqft_per_animal * animal.count} sq ft</span>
                  )}
                </div>
                <p className="text-amber-950 text-[11px] font-body leading-relaxed">{s.benefit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {benefits.length > 0 && (
        <div>
          <p className="text-green-500 text-xs font-body font-bold uppercase tracking-wider mb-2">♻️ Waste → Fertilizer</p>
          {benefits.map((s, i) => (
            <div key={i} className="bg-green-900/20 border border-green-800/20 rounded-xl p-3 mb-2">
              <p className="text-green-300 text-xs font-body font-bold mb-0.5">{s.plant_name}</p>
              <p className="text-green-600 text-[11px] font-body leading-relaxed">{s.benefit}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Animals Page ────────────────────────────────────────────────
export default function AnimalsPage() {
  const supabase = createClient()
  const [animals,       setAnimals]       = useState<Animal[]>([])
  const [loading,       setLoading]       = useState(true)
  const [showAdd,       setShowAdd]       = useState(false)
  const [logTarget,     setLogTarget]     = useState<Animal | null>(null)
  const [chatTarget,    setChatTarget]    = useState<Animal | null>(null)
  const [synergyTarget, setSynergyTarget] = useState<Animal | null>(null)
  const [recentLogs,    setRecentLogs]    = useState<Record<string, Log[]>>({})

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('sprout_animals').select('*')
      .eq('user_id', user.id).eq('is_archived', false).order('created_at', { ascending: false })
    setAnimals(data ?? [])
    if (data && data.length > 0) {
      const logMap: Record<string, Log[]> = {}
      await Promise.all(data.map(async (a: Animal) => {
        const { data: logs } = await supabase.from('sprout_animal_logs').select('*')
          .eq('animal_id', a.id).order('logged_at', { ascending: false }).limit(3)
        logMap[a.id] = logs ?? []
      }))
      setRecentLogs(logMap)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const fishCount  = animals.filter(a => ['koi','goldfish','tilapia','trout','catfish','bass','perch','carp'].includes(a.species)).length
  const birdCount  = animals.filter(a => ['chicken','duck','quail','turkey','goose'].includes(a.species)).length
  const totalCount = animals.reduce((s, a) => s + a.count, 0)

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-green-ink text-3xl font-black tracking-tight">My Animals</h1>
          <p className="text-green-700 text-sm font-body mt-0.5">
            {animals.length > 0
              ? `${totalCount} animals · ${[...new Set(animals.map(a => a.species))].length} species${fishCount > 0 ? ` · ${fishCount} fish species` : ''}`
              : 'Birds · Mammals · Fish · Insects — your whole farm ecosystem'}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-body font-bold text-sm px-4 py-2.5 rounded-xl transition-all hover:-translate-y-px shadow-sprout-sm">
          <span>🐾</span> Add Animal
        </button>
      </div>

      {/* Aquaponics callout if they have fish */}
      {fishCount > 0 && (
        <div className="bg-sky-900/20 border border-sky-800/30 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
          <span className="text-2xl">💧</span>
          <div>
            <p className="text-sky-300 font-body font-bold text-sm">Aquaponics water cycle active</p>
            <p className="text-sky-600 text-xs font-body mt-0.5">Your fish water can fertilize your raised beds. Check the Plants tab on each fish to see what grows best in it.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-52 bg-green-900/20 rounded-2xl animate-pulse" />)}
        </div>
      ) : animals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex gap-1 text-4xl mb-5">🐓🐐🐝🐇🐟</div>
          <h3 className="font-display text-green-ink text-2xl font-black mb-3">No animals yet</h3>
          <p className="text-green-700 font-body text-sm mb-8 max-w-sm leading-relaxed">
            Track your flock, herd, hive, and pond. Sprout knows which plants cut your feed costs, which animals fertilize your garden, and how to build a self-sustaining ecosystem.
          </p>
          <button onClick={() => setShowAdd(true)}
            className="bg-green-700 hover:bg-green-600 text-white font-body font-bold px-8 py-4 rounded-xl transition-all hover:-translate-y-px text-base shadow-sprout-md">
            Add Your First Animal 🐾
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {animals.map(animal => {
            const hs = HEALTH_STYLE[animal.health_status] ?? HEALTH_STYLE.healthy
            const logs = recentLogs[animal.id] ?? []
            const lastProduction = logs.find(l => l.log_type === 'production')
            const isFish = ['koi','goldfish','tilapia','trout','catfish','bass','perch','carp'].includes(animal.species)
            const isAqua = animal.housing_type === 'aquaponics'

            return (
              <div key={animal.id} className="bg-white border border-green-100 rounded-2xl shadow-sprout-sm overflow-hidden hover:shadow-sprout-md transition-all duration-200">
                <div className={`px-5 py-4 ${isFish ? 'bg-gradient-to-br from-sky-900 to-sky-950' : 'bg-gradient-to-br from-green-800 to-green-900'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-4xl">{animal.emoji}</span>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${hs.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hs.dot}`} />
                        <span className="text-[10px] font-body font-bold">{hs.label}</span>
                      </div>
                      {isAqua && (
                        <span className="text-[10px] font-body font-bold px-2 py-0.5 bg-sky-800/60 text-sky-300 rounded-full">💧 Aquaponics</span>
                      )}
                    </div>
                  </div>
                  <h3 className="font-display text-white font-black text-lg leading-tight">
                    {animal.name ?? `${animal.count} ${animal.species}${animal.count > 1 ? 's' : ''}`}
                  </h3>
                  <p className="text-green-400 text-xs font-body capitalize">
                    {animal.breed ?? animal.species}{animal.count > 1 && animal.name ? ` · ${animal.count}` : ''}{animal.age_months ? ` · ${animal.age_months}mo` : ''}
                  </p>
                </div>

                <div className="px-5 py-3 border-b border-green-50">
                  <div className="flex items-center gap-4">
                    {animal.produce_type && (
                      <div className="text-center">
                        <div className="text-green-ink font-body font-bold text-sm capitalize">
                          {animal.produce_type === 'eggs' ? '🥚' : animal.produce_type === 'milk' ? '🥛' : animal.produce_type === 'honey' ? '🍯' : animal.produce_type === 'fertilizer' ? '💧' : '📦'}
                          {' '}{animal.produce_type}
                        </div>
                        <div className="text-green-600 text-[10px] font-body">produces</div>
                      </div>
                    )}
                    {lastProduction && (
                      <div className="text-center">
                        <div className="text-green-ink font-body font-bold text-sm">{lastProduction.quantity} {lastProduction.unit}</div>
                        <div className="text-green-600 text-[10px] font-body">last log</div>
                      </div>
                    )}
                    {animal.housing_type && (
                      <div className="text-center">
                        <div className="text-green-ink font-body font-bold text-sm capitalize">{animal.housing_type}</div>
                        <div className="text-green-600 text-[10px] font-body">housing</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3 grid grid-cols-3 gap-2">
                  <button onClick={() => setChatTarget(animal)}
                    className="flex flex-col items-center gap-1 py-2 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
                    <span className="text-lg">💬</span>
                    <span className="text-green-700 text-[10px] font-body font-semibold">Ask Sprout</span>
                  </button>
                  <button onClick={() => setLogTarget(animal)}
                    className="flex flex-col items-center gap-1 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors">
                    <span className="text-lg">{isFish ? '💧' : '📋'}</span>
                    <span className="text-amber-900 text-[10px] font-body font-semibold">{isFish ? 'Log Water' : 'Log'}</span>
                  </button>
                  <button onClick={() => setSynergyTarget(synergyTarget?.id === animal.id ? null : animal)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-colors
                      ${synergyTarget?.id === animal.id ? 'bg-green-600' : 'bg-green-50 hover:bg-green-100'}`}>
                    <span className="text-lg">{isFish ? '🌿' : '🌿'}</span>
                    <span className={`text-[10px] font-body font-semibold ${synergyTarget?.id === animal.id ? 'text-white' : 'text-green-700'}`}>
                      {isFish ? 'Plants' : 'Plants'}
                    </span>
                  </button>
                </div>

                {synergyTarget?.id === animal.id && (
                  <div className="px-4 pb-4 border-t border-green-50 pt-3 max-h-72 overflow-y-auto">
                    <SynergyPanel animal={animal} />
                  </div>
                )}
              </div>
            )
          })}

          <button onClick={() => setShowAdd(true)}
            className="group border-2 border-dashed border-green-700/40 rounded-2xl flex flex-col items-center justify-center p-8 text-center hover:border-green-500 hover:bg-green-900/10 transition-all duration-200 min-h-[220px]">
            <div className="text-3xl mb-2 opacity-50 group-hover:opacity-80 transition-opacity">🐾</div>
            <span className="text-green-600 font-body font-semibold text-sm group-hover:text-green-400">+ Add Animal</span>
          </button>
        </div>
      )}

      {showAdd    && <AddAnimalModal onClose={() => setShowAdd(false)} onAdded={load} />}
      {logTarget  && <LogModal animal={logTarget} onClose={() => setLogTarget(null)} onLogged={load} />}
      {chatTarget && <AnimalChat animal={chatTarget} onClose={() => setChatTarget(null)} />}
    </div>
  )
}
