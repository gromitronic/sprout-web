'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const ENVIRONMENTS = [
  { id: 'outdoor',     label: 'Outdoor Garden', emoji: '🌳' },
  { id: 'indoor',      label: 'Indoor Pots',    emoji: '🪴' },
  { id: 'raised_beds', label: 'Raised Beds',    emoji: '📦' },
  { id: 'mixed',       label: 'Mixed / All',    emoji: '🌿' },
]

// USDA zone lookup by ZIP (simplified — production uses a real API)
async function lookupZone(zip: string): Promise<{ zone: string; city: string; lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places?.[0]
    if (!place) return null
    const lat = parseFloat(place.latitude)
    // Very simplified zone assignment — real app uses USDA API
    let zone = '6b'
    if (lat >= 35) zone = lat >= 40 ? (lat >= 45 ? '5b' : '6b') : '7b'
    if (lat < 35)  zone = lat >= 30 ? '8b' : (lat >= 25 ? '9b' : '10b')
    return { zone, city: `${place['place name']}, ${data['country abbreviation']}`, lat, lng: parseFloat(place.longitude) }
  } catch { return null }
}

export default function OnboardingPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [step,        setStep]        = useState(1)
  const [zip,         setZip]         = useState('')
  const [zoneData,    setZoneData]    = useState<{ zone: string; city: string; lat: number; lng: number } | null>(null)
  const [env,         setEnv]         = useState('')
  const [loading,     setLoading]     = useState(false)
  const [lookingUp,   setLookingUp]   = useState(false)

  async function handleZipLookup() {
    if (zip.length < 5) return
    setLookingUp(true)
    const data = await lookupZone(zip)
    setLookingUp(false)
    if (data) { setZoneData(data); setStep(2) }
    else toast.error('ZIP not found — try a nearby code')
  }

  async function handleGPS() {
    setLookingUp(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords
      let zone = '6b'
      if (lat >= 35) zone = lat >= 40 ? (lat >= 45 ? '5b' : '6b') : '7b'
      if (lat < 35)  zone = lat >= 30 ? '8b' : (lat >= 25 ? '9b' : '10b')
      setZoneData({ zone, city: 'Your Location', lat, lng })
      setLookingUp(false)
      setStep(2)
    }, () => { setLookingUp(false); toast.error('Location access denied') })
  }

  async function handleFinish() {
    if (!zoneData || !env) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const zoneLabels: Record<string, string> = {
      '5b': 'Continental · Avg low -15 to -10°F',
      '6b': 'Temperate · Avg low -5 to 0°F',
      '7b': 'Mild · Avg low 5 to 10°F',
      '8b': 'Warm · Avg low 15 to 20°F',
      '9b': 'Subtropical · Avg low 25 to 30°F',
      '10b': 'Tropical · Avg low 35 to 40°F',
    }

    const { error } = await supabase.from('profiles').update({
      garden_lat: zoneData.lat,
      garden_lng: zoneData.lng,
      garden_city: zoneData.city,
      garden_zip: zip || null,
      usda_zone: zoneData.zone,
      zone_label: zoneLabels[zoneData.zone] ?? '',
      growing_env: env,
    }).eq('id', user.id)

    if (error) { toast.error('Error saving — try again'); setLoading(false); return }

    // Award onboarding bonus XP
    await supabase.rpc('award_xp', { p_user_id: user.id, p_amount: 50, p_multiplier: false })
    toast.success('🌱 +50 XP! Welcome to SPROUT!')
    router.push('/garden')
  }

  return (
    <div className="min-h-screen bg-green-950 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        {/* Mascot */}
        <div className="flex justify-center mb-6">
          <Image src="/mascots/sproutbase.png" alt="Sprout" width={100} height={100}
            className="drop-shadow-[0_8px_32px_rgba(61,112,72,0.5)] animate-bob" priority />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`rounded-full transition-all duration-300 ${s === step ? 'w-8 h-2 bg-green-400' : s < step ? 'w-2 h-2 bg-green-600' : 'w-2 h-2 bg-green-900'}`} />
          ))}
        </div>

        <div className="bg-green-900/40 border border-green-800/50 rounded-2xl p-8">

          {/* Step 1 — Location */}
          {step === 1 && (
            <>
              <h1 className="font-display text-white text-2xl font-black mb-2">Where&apos;s your garden?</h1>
              <p className="text-green-500 text-sm font-body mb-6 leading-relaxed">
                This can be different from where you live — perfect if you manage a remote garden.
              </p>

              <button onClick={handleGPS} disabled={lookingUp}
                className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-body font-bold py-3.5 rounded-xl mb-4 transition-all">
                {lookingUp ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '📍'}
                Use my current location
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-green-800" />
                <span className="text-green-700 text-xs font-body">or enter ZIP code</span>
                <div className="flex-1 h-px bg-green-800" />
              </div>

              <div className="flex gap-2">
                <input value={zip} onChange={e => setZip(e.target.value.slice(0, 5))}
                  onKeyDown={e => e.key === 'Enter' && handleZipLookup()}
                  placeholder="e.g. 34453"
                  className="flex-1 bg-green-950/60 border border-green-800/60 text-white placeholder-green-700 font-body text-sm px-4 py-3 rounded-xl outline-none focus:border-green-500 transition-colors" />
                <button onClick={handleZipLookup} disabled={zip.length < 5 || lookingUp}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-body font-bold px-5 py-3 rounded-xl transition-all">
                  {lookingUp ? '...' : 'Go'}
                </button>
              </div>
            </>
          )}

          {/* Step 2 — Zone confirmation */}
          {step === 2 && zoneData && (
            <>
              <h1 className="font-display text-white text-2xl font-black mb-2">Your growing zone</h1>
              <p className="text-green-500 text-sm font-body mb-6">All advice will be tuned to this zone. You can change it anytime.</p>

              <div className="bg-green-950/60 border border-green-700/40 rounded-xl p-5 mb-6">
                <div className="font-display text-green-400 text-5xl font-black leading-none mb-1">
                  Zone {zoneData.zone}
                </div>
                <div className="text-white font-body font-semibold text-base">{zoneData.city}</div>
                <div className="text-green-500 text-sm font-body mt-1">
                  {zoneData.zone === '9b' ? 'Subtropical · Avg low 25–30°F' :
                   zoneData.zone === '8b' ? 'Warm Temperate · Avg low 15–20°F' :
                   zoneData.zone === '7b' ? 'Mild · Avg low 5–10°F' :
                   zoneData.zone === '6b' ? 'Temperate · Avg low -5–0°F' : 'Cool Temperate'}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['Year-round', 'Native plants', 'Frost dates'].map(t => (
                    <span key={t} className="bg-green-800/60 text-green-400 text-xs font-body font-semibold px-2.5 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-green-800 text-green-500 font-body font-semibold py-3 rounded-xl hover:border-green-600 transition-colors text-sm">
                  ← Change
                </button>
                <button onClick={() => setStep(3)} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-body font-bold py-3 rounded-xl transition-all text-sm">
                  Looks right →
                </button>
              </div>
            </>
          )}

          {/* Step 3 — Environment */}
          {step === 3 && (
            <>
              <h1 className="font-display text-white text-2xl font-black mb-2">How do you grow?</h1>
              <p className="text-green-500 text-sm font-body mb-6">Select all that apply to your situation.</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {ENVIRONMENTS.map(e => (
                  <button key={e.id} onClick={() => setEnv(e.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-body text-sm font-semibold
                      ${env === e.id ? 'border-green-500 bg-green-800/40 text-green-300' : 'border-green-800/40 bg-green-950/40 text-green-600 hover:border-green-700'}`}>
                    <span className="text-2xl">{e.emoji}</span>
                    {e.label}
                  </button>
                ))}
              </div>

              <button onClick={handleFinish} disabled={!env || loading}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-display font-black text-lg py-4 rounded-xl transition-all hover:-translate-y-px">
                {loading ? 'Setting up...' : 'Start Growing! 🌱'}
              </button>
              <p className="text-green-700 text-xs text-center mt-3 font-body">+50 XP bonus for completing setup</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
