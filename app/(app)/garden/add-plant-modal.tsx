'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────
type AddMethod = {
  id: string
  emoji: string
  title: string
  subtitle: string
  dayCount: number | null  // null = ask user
  healthStatus: string
  color: string
}

const ADD_METHODS: AddMethod[] = [
  {
    id: 'seed',
    emoji: '🌱',
    title: 'From a Seed',
    subtitle: 'Just planted — starting from scratch',
    dayCount: 0,
    healthStatus: 'healthy',
    color: 'from-green-900/60 to-green-800/40 border-green-700/40 hover:border-green-500',
  },
  {
    id: 'seedling',
    emoji: '🌿',
    title: 'From a Seedling',
    subtitle: 'Small starter plant, just getting going',
    dayCount: 14,
    healthStatus: 'healthy',
    color: 'from-green-800/60 to-green-700/40 border-green-600/40 hover:border-green-400',
  },
  {
    id: 'cutting',
    emoji: '✂️',
    title: 'From a Cutting',
    subtitle: 'Propagated from another plant',
    dayCount: 7,
    healthStatus: 'healthy',
    color: 'from-teal-900/60 to-teal-800/40 border-teal-700/40 hover:border-teal-500',
  },
  {
    id: 'nursery',
    emoji: '🛒',
    title: 'From a Nursery / Store',
    subtitle: 'Bought it already growing',
    dayCount: 30,
    healthStatus: 'healthy',
    color: 'from-amber-900/60 to-amber-800/40 border-amber-700/40 hover:border-amber-500',
  },
  {
    id: 'transplant',
    emoji: '🪴',
    title: 'Transplant',
    subtitle: 'Moving a plant from another pot or spot',
    dayCount: null,
    healthStatus: 'healthy',
    color: 'from-orange-900/60 to-orange-800/40 border-orange-700/40 hover:border-orange-500',
  },
  {
    id: 'existing',
    emoji: '🌳',
    title: 'Existing Plant in Garden',
    subtitle: "Already growing — I'm just tracking it now",
    dayCount: null,
    healthStatus: 'healthy',
    color: 'from-green-950/80 to-green-900/40 border-green-700/30 hover:border-green-500',
  },
  {
    id: 'photo',
    emoji: '📸',
    title: 'Identify by Photo',
    subtitle: "Take a photo — Sprout will figure it out",
    dayCount: 0,
    healthStatus: 'healthy',
    color: 'from-sky-900/60 to-sky-800/40 border-sky-700/40 hover:border-sky-400',
  },
  {
    id: 'search',
    emoji: '🔍',
    title: 'Search by Name',
    subtitle: 'I know what it is — let me find it',
    dayCount: 0,
    healthStatus: 'healthy',
    color: 'from-purple-900/60 to-purple-800/40 border-purple-700/40 hover:border-purple-400',
  },
]

// ─── Step 2: Name + Days form ─────────────────────────────────────────
function PlantDetailsForm({
  method,
  onBack,
  onAdd,
}: {
  method: AddMethod
  onBack: () => void
  onAdd: (name: string, days: number) => Promise<void>
}) {
  const [name,    setName]    = useState('')
  const [days,    setDays]    = useState(method.dayCount?.toString() ?? '')
  const [saving,  setSaving]  = useState(false)

  async function handleSubmit() {
    if (!name.trim()) { toast.error('Enter a plant name'); return }
    setSaving(true)
    await onAdd(name.trim(), parseInt(days) || 0)
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 pb-4 border-b border-green-800/40">
        <span className="text-3xl">{method.emoji}</span>
        <div>
          <h3 className="font-display text-white font-black text-lg leading-tight">{method.title}</h3>
          <p className="text-green-500 text-xs font-body">{method.subtitle}</p>
        </div>
      </div>

      {/* Plant name */}
      <div>
        <label className="text-green-400 text-xs font-body font-bold uppercase tracking-wide block mb-2">
          What plant is this?
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="e.g. Cherry Tomato, Basil, Rose..."
          autoFocus
          className="w-full bg-green-950/60 border border-green-700/50 text-white placeholder-green-700 font-body text-sm px-4 py-3 rounded-xl outline-none focus:border-green-400 transition-colors"
        />
        <p className="text-green-700 text-xs font-body mt-1.5">
          Don&apos;t know exactly? Your best guess is fine — Sprout can help identify it later.
        </p>
      </div>

      {/* Day count — only show if not fixed */}
      {method.dayCount === null && (
        <div>
          <label className="text-green-400 text-xs font-body font-bold uppercase tracking-wide block mb-2">
            Roughly how many days old is it?
          </label>
          <div className="flex gap-2">
            {['7', '14', '30', '60', '90', '180'].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`flex-1 py-2 rounded-lg text-xs font-body font-semibold border transition-all
                  ${days === d
                    ? 'bg-green-600 text-white border-green-500'
                    : 'bg-green-950/40 text-green-500 border-green-800/40 hover:border-green-600'
                  }`}
              >
                {parseInt(d) >= 365 ? '1yr+' : `${d}d`}
              </button>
            ))}
          </div>
          <input
            value={days}
            onChange={e => setDays(e.target.value.replace(/\D/, ''))}
            placeholder="Or type exact days..."
            className="w-full mt-2 bg-green-950/60 border border-green-700/50 text-white placeholder-green-700 font-body text-sm px-4 py-2.5 rounded-xl outline-none focus:border-green-400 transition-colors"
          />
        </div>
      )}

      {method.dayCount !== null && (
        <div className="bg-green-900/30 border border-green-800/30 rounded-xl px-4 py-3">
          <p className="text-green-400 text-xs font-body">
            <span className="font-bold">Starting at day {method.dayCount}.</span>{' '}
            Sprout will track growth from here — you can adjust this anytime.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 border border-green-800 text-green-500 font-body font-semibold py-3 rounded-xl text-sm hover:border-green-600 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || saving}
          className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-body font-bold py-3 rounded-xl text-sm transition-all hover:-translate-y-px"
        >
          {saving ? 'Adding...' : `Add to Garden 🌱`}
        </button>
      </div>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────
export default function AddPlantModal({ onClose }: { onClose: () => void }) {
  const router   = useRouter()
  const supabase = createClient()
  const [step,   setStep]   = useState<'choose' | 'details'>('choose')
  const [method, setMethod] = useState<AddMethod | null>(null)

  function handleMethodSelect(m: AddMethod) {
    // Photo → go straight to identify page
    if (m.id === 'photo') {
      router.push('/identify')
      onClose()
      return
    }
    // Search → go to identify page with search mode (same page handles both)
    if (m.id === 'search') {
      router.push('/identify?mode=search')
      onClose()
      return
    }
    setMethod(m)
    setStep('details')
  }

  async function handleAdd(name: string, days: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not signed in'); return }

    const { data: plant, error } = await supabase.from('plants').insert({
      user_id:      user.id,
      common_name:  name,
      day_count:    days,
      health_status: method?.healthStatus ?? 'healthy',
      planted_at:   new Date(Date.now() - days * 86400000).toISOString().split('T')[0],
      growing_env:  'outdoor',
    }).select('id').single()

    if (error) { toast.error('Could not add plant'); return }

    await supabase.rpc('award_xp',    { p_user_id: user.id, p_amount: 10, p_multiplier: false })
    await supabase.rpc('increment_plant_count', { p_user_id: user.id })

    toast.success(`🌱 ${name} added! +10 XP`)
    router.push(`/chat/${plant.id}`)
    onClose()
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-green-950 border border-green-800/50 rounded-2xl shadow-sprout-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-green-900/50">
          <div className="flex items-center gap-3">
            <Image src="/mascots/sproutdigging.png" alt="Sprout" width={36} height={36} className="animate-bob" />
            <div>
              <h2 className="font-display text-white font-black text-lg leading-tight">
                {step === 'choose' ? 'Add a Plant' : 'Plant Details'}
              </h2>
              <p className="text-green-600 text-xs font-body">
                {step === 'choose' ? 'How are you adding it?' : 'Tell Sprout about your plant'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-green-600 hover:text-green-400 text-xl font-bold transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-900/40"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">

          {/* Step 1 — Choose method */}
          {step === 'choose' && (
            <div className="grid grid-cols-2 gap-3">
              {ADD_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleMethodSelect(m)}
                  className={`relative bg-gradient-to-br ${m.color} border rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sprout-md group`}
                >
                  <span className="text-3xl block mb-2">{m.emoji}</span>
                  <h3 className="font-body font-bold text-white text-sm leading-tight mb-1">
                    {m.title}
                  </h3>
                  <p className="text-green-500 text-[11px] font-body leading-snug group-hover:text-green-400 transition-colors">
                    {m.subtitle}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Step 2 — Details form */}
          {step === 'details' && method && (
            <PlantDetailsForm
              method={method}
              onBack={() => setStep('choose')}
              onAdd={handleAdd}
            />
          )}
        </div>
      </div>
    </div>
  )
}
