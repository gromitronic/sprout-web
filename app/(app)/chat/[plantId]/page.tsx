'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { sendChatMessage } from '@/lib/api'
import toast from 'react-hot-toast'

type Message = { id: string; role: 'user' | 'assistant'; content: string; photo_url?: string; created_at: string }
type Plant   = { id: string; common_name: string; latin_name: string; emoji: string; health_status: string; day_count: number }

const QUICK_REPLIES = ['How often should I water?', 'Any pest concerns?', 'When can I harvest?', 'Companion plants?']

// ─── Same compression logic as identify page ─────────────────────────
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1200
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function PlantChatPage() {
  const { plantId } = useParams<{ plantId: string }>()
  const router    = useRouter()
  const supabase  = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)

  const [plant,       setPlant]       = useState<Plant | null>(null)
  const [messages,    setMessages]    = useState<Message[]>([])
  const [input,       setInput]       = useState('')
  const [sending,     setSending]     = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoBase64,  setPhotoBase64]  = useState<string | null>(null)
  const [compressing,  setCompressing]  = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: plantData }, { data: history }] = await Promise.all([
        supabase.from('plants').select('id, common_name, latin_name, emoji, health_status, day_count')
          .eq('id', plantId).eq('user_id', user.id).single(),
        supabase.from('chat_histories').select('*')
          .eq('plant_id', plantId).eq('user_id', user.id)
          .order('created_at', { ascending: true }).limit(50),
      ])

      if (!plantData) { router.push('/garden'); return }
      setPlant(plantData)
      setMessages(history ?? [])
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    load()
  }, [plantId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle photo selection — compress before attaching
  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCompressing(true)
    try {
      const dataUrl = await compressImage(file)
      setPhotoPreview(dataUrl)
      setPhotoBase64(dataUrl.split(',')[1])
    } catch {
      toast.error('Could not process photo')
    } finally {
      setCompressing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function clearPhoto() {
    setPhotoPreview(null)
    setPhotoBase64(null)
  }

  async function sendMessage(text: string) {
    if ((!text.trim() && !photoBase64) || sending || !plant) return
    setSending(true)
    const msgText = text.trim() || (photoBase64 ? 'What do you see in this photo of my plant?' : '')
    setInput('')
    const prevPhoto = photoPreview
    clearPhoto()

    // Optimistic user message
    const tempId = Date.now().toString()
    setMessages(prev => [...prev, {
      id: tempId, role: 'user', content: msgText,
      photo_url: prevPhoto ?? undefined, created_at: new Date().toISOString()
    }])

    // Typing indicator
    const typingId = `typing-${tempId}`
    setMessages(prev => [...prev, { id: typingId, role: 'assistant', content: '...', created_at: new Date().toISOString() }])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not signed in')

      const response = await sendChatMessage(supabase, plantId, msgText,
        photoBase64 ? { photo_base64: photoBase64, media_type: 'image/jpeg' } : undefined)

      setMessages(prev => prev.filter(m => m.id !== typingId).concat({
        id: `ai-${tempId}`, role: 'assistant',
        content: response.message, created_at: new Date().toISOString(),
      }))
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== typingId))
      toast.error(err.message ?? 'Could not send message')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const healthColor: Record<string, string> = {
    thriving: 'text-green-400', healthy: 'text-green-500',
    needs_attention: 'text-amber-400', alert: 'text-red-400', dormant: 'text-stone-400',
  }

  return (
    <div className="flex flex-col h-full">

      {/* Plant header */}
      {plant && (
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-green-100 flex-shrink-0">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            {plant.emoji ?? '🌿'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-body font-bold text-green-ink text-sm truncate">{plant.common_name}</h2>
            <p className={`text-xs font-body font-semibold ${healthColor[plant.health_status] ?? 'text-green-500'}`}>
              {plant.health_status.replace('_', ' ')} · Day {plant.day_count}
            </p>
          </div>
          <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={32} height={32} className="flex-shrink-0 opacity-70" />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-green-50/30">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-green-600/30 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={80} height={80}
              className="mb-4 drop-shadow-xl animate-bob" />
            <h3 className="font-display text-green-ink text-xl font-black mb-2">
              Hey there! I&apos;m Sprout 🌱
            </h3>
            <p className="text-green-700 font-body text-sm leading-relaxed max-w-xs">
              I know everything about your {plant?.common_name ?? 'plant'}. Ask me anything or send a photo for a health check!
            </p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={28} height={28}
                  className="flex-shrink-0 mt-1 rounded-full" />
              )}
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm font-body leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-green-700 text-white rounded-tr-sm'
                  : msg.content === '...'
                    ? 'bg-white border border-green-100 text-green-400 rounded-tl-sm'
                    : 'bg-white border border-green-100 text-green-900 rounded-tl-sm shadow-sprout-sm'
                }`}>
                {/* Photo attachment */}
                {msg.photo_url && (
                  <img src={msg.photo_url} alt="Attached" className="rounded-xl mb-2 max-w-full max-h-48 object-cover" />
                )}
                {msg.content === '...' ? (
                  <span className="flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse-dot"
                        style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </span>
                ) : msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {messages.length < 3 && !loading && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto flex-shrink-0 bg-white border-t border-green-100">
          {QUICK_REPLIES.map(q => (
            <button key={q} onClick={() => sendMessage(q)} disabled={sending}
              className="flex-shrink-0 text-xs font-body font-semibold text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Photo preview strip */}
      {(photoPreview || compressing) && (
        <div className="px-4 py-2 bg-white border-t border-green-100 flex items-center gap-3 flex-shrink-0">
          {compressing ? (
            <div className="flex items-center gap-2 text-green-600 text-xs font-body">
              <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-500 rounded-full animate-spin" />
              Optimising photo...
            </div>
          ) : photoPreview ? (
            <>
              <img src={photoPreview} alt="Attached" className="w-14 h-14 rounded-xl object-cover border border-green-200" />
              <span className="text-green-600 text-xs font-body font-semibold flex-1">Photo attached — ask Sprout anything!</span>
              <button onClick={clearPhoto} className="text-red-400 hover:text-red-600 text-xs font-body font-bold transition-colors">
                Remove
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 py-3 bg-white border-t border-green-100 flex gap-2 flex-shrink-0">
        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        {/* Camera button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={sending || compressing}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 disabled:opacity-40 transition-all"
          title="Attach a photo"
        >
          📷
        </button>

        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder={photoPreview ? 'Ask about this photo...' : `Ask about your ${plant?.common_name ?? 'plant'}...`}
          className="flex-1 bg-green-50 border border-green-200 text-green-ink placeholder-green-400 font-body text-sm px-4 py-2.5 rounded-xl outline-none focus:border-green-500 transition-colors"
        />

        <button
          onClick={() => sendMessage(input)}
          disabled={(!input.trim() && !photoBase64) || sending || compressing}
          className="bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-all hover:-translate-y-px flex-shrink-0">
          {sending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.903 6.557H13.5a.75.75 0 010 1.5H4.182l-1.903 6.557a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
