'use client'
import { useCallback, useState } from 'react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { identifyPlant, type IdentifyResult } from '@/lib/api'
import toast from 'react-hot-toast'

export default function IdentifyPage() {
  const supabase = createClient()
  const [preview,  setPreview]  = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result,   setResult]   = useState<IdentifyResult | null>(null)
  const [saving,   setSaving]   = useState(false)

  const onDrop = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
    setResult(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  })

  async function handleScan() {
    if (!preview) return
    setScanning(true)
    try {
      const base64 = preview.split(',')[1]
      const mediaType = preview.split(';')[0].split(':')[1] as 'image/jpeg' | 'image/png'
      const data = await identifyPlant(supabase, base64, mediaType)
      setResult(data)
      if (data.identified) toast.success(`🌱 +${data.xp_earned} XP! ${data.common_name} identified!`)
    } catch (err: any) {
      toast.error(err.message ?? 'Identification failed')
    } finally {
      setScanning(false)
    }
  }

  async function handleAddToGarden() {
    if (!result || !result.identified) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const { data: plant, error } = await supabase.from('plants').insert({
        user_id:      user.id,
        common_name:  result.common_name,
        latin_name:   result.latin_name,
        category:     result.category,
        emoji:        result.emoji,
        usda_zone_fit: result.zone_fit,
        zone_notes:   result.zone_notes,
        water_freq_days: result.water_freq_days,
        sunlight:     result.sunlight,
        soil_ph_min:  result.soil_ph_min,
        soil_ph_max:  result.soil_ph_max,
        temp_min_f:   result.temp_min_f,
        temp_max_f:   result.temp_max_f,
        difficulty:   result.difficulty,
        scan_confidence: result.confidence,
        planted_at:   new Date().toISOString().split('T')[0],
      }).select('id').single()

      if (error) throw error

      // Award +10 XP for adding to garden
      await supabase.rpc('award_xp', { p_user_id: user.id, p_amount: 10, p_multiplier: false })
      await supabase.rpc('increment_plant_count', { p_user_id: user.id })

      toast.success('🌿 Added to your garden! +10 XP')
      window.location.href = `/chat/${plant.id}`
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-green-ink text-3xl font-black tracking-tight">Identify a Plant</h1>
        <p className="text-green-700 text-sm font-body mt-1">Upload a photo and our AI will identify it instantly</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload area */}
        <div>
          <div {...getRootProps()} className={`relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 aspect-square flex flex-col items-center justify-center
            ${isDragActive ? 'border-green-500 bg-green-900/20' : preview ? 'border-green-600' : 'border-green-800/40 bg-green-900/10 hover:border-green-600'}`}>
            <input {...getInputProps()} />
            {preview ? (
              <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6">
                <Image src="/mascots/sproutsearching.png" alt="Sprout searching" width={80} height={80} className="mx-auto mb-3 opacity-60" />
                <p className="text-green-500 font-body font-semibold text-sm">
                  {isDragActive ? 'Drop it here!' : 'Drop a photo here, or tap to upload'}
                </p>
                <p className="text-green-700 text-xs font-body mt-1">JPG, PNG, HEIC supported</p>
              </div>
            )}
            {scanning && (
              <div className="absolute inset-0 bg-green-950/80 flex flex-col items-center justify-center gap-3">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-2 border-green-500/30" />
                  <div className="absolute inset-0 rounded-full border-2 border-t-green-400 animate-spin" />
                  <Image src="/mascots/sproutsearching.png" alt="" width={32} height={32} className="absolute inset-2" />
                </div>
                <p className="text-green-400 font-body font-semibold text-sm animate-pulse">Identifying...</p>
                {/* Scan line */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-green-400/60 animate-scan" />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            {preview && (
              <button onClick={() => { setPreview(null); setResult(null) }}
                className="flex-1 border border-green-800 text-green-500 font-body font-semibold py-2.5 rounded-xl text-sm hover:border-green-600 transition-colors">
                Clear
              </button>
            )}
            <button onClick={handleScan} disabled={!preview || scanning}
              className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-body font-bold py-2.5 rounded-xl text-sm transition-all hover:-translate-y-px">
              {scanning ? 'Scanning...' : '🔍 Identify Plant'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div>
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-green-900/10 rounded-2xl border border-green-900/20">
              <Image src="/mascots/sprout_holding_magnifier_and_phone.png" alt="Sprout" width={100} height={100} className="mb-4 opacity-40" />
              <p className="text-green-700 font-body text-sm">Upload a photo and hit Identify to see results here</p>
            </div>
          ) : !result.identified ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-amber-900/10 rounded-2xl border border-amber-800/30">
              <span className="text-4xl mb-3">🤔</span>
              <p className="text-amber-300 font-body font-semibold mb-2">Couldn&apos;t identify</p>
              <p className="text-amber-600 text-sm font-body">Try a clearer photo with better lighting, or a closer shot of the leaves</p>
            </div>
          ) : (
            <div className="bg-white border border-green-100 rounded-2xl shadow-sprout-md overflow-hidden">
              {/* Plant header */}
              <div className="bg-gradient-to-br from-green-800 to-green-900 px-5 py-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-4xl">{result.emoji}</span>
                  <span className="bg-green-700/60 text-green-300 text-xs font-body font-bold px-2.5 py-1 rounded-full">
                    {result.confidence}% match
                  </span>
                </div>
                <h2 className="font-display text-white text-xl font-black">{result.common_name}</h2>
                <p className="text-green-400 text-xs font-body italic">{result.latin_name}</p>
              </div>

              <div className="p-4 space-y-3">
                {/* Care quick stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Water',    value: `Every ${result.water_freq_days}d` },
                    { label: 'Sun',      value: result.sunlight?.replace('_', ' ') },
                    { label: 'Difficulty', value: result.difficulty },
                  ].map(s => (
                    <div key={s.label} className="bg-green-50 rounded-lg p-2 text-center">
                      <div className="text-green-ink font-body font-bold text-sm capitalize">{s.value}</div>
                      <div className="text-green-600 text-[10px] font-body">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Zone fit */}
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-green-600 text-[10px] font-body font-bold uppercase tracking-wide mb-1">Zone Notes</p>
                  <p className="text-green-800 text-xs font-body leading-relaxed">{result.zone_notes}</p>
                </div>

                {/* Sprout says bubble */}
                <div className="flex gap-2 bg-green-900/5 border border-green-200 rounded-xl p-3">
                  <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={28} height={28} className="flex-shrink-0 mt-0.5" />
                  <p className="text-green-800 text-xs font-body leading-relaxed">&quot;{result.sprout_says}&quot;</p>
                </div>

                {/* Companions */}
                {result.companions?.length > 0 && (
                  <div>
                    <p className="text-green-600 text-[10px] font-body font-bold uppercase tracking-wide mb-1.5">Companion Plants</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.companions.map(c => (
                        <span key={c} className="bg-green-100 text-green-700 text-xs font-body font-semibold px-2 py-0.5 rounded-full">💚 {c}</span>
                      ))}
                      {result.avoid?.map(c => (
                        <span key={c} className="bg-red-50 text-red-500 text-xs font-body font-semibold px-2 py-0.5 rounded-full">✗ {c}</span>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={handleAddToGarden} disabled={saving}
                  className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-body font-bold py-3 rounded-xl text-sm transition-all hover:-translate-y-px">
                  {saving ? 'Adding...' : '🌿 Add to My Garden +10 XP'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
