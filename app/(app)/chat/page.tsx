'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { sendGeneralChat } from '@/lib/api'
import toast from 'react-hot-toast'

type Plant = {
  id: string
  common_name: string
  latin_name: string
  emoji: string
  health_status: string
  day_count: number
}

type Message = { id: string; role: 'user' | 'assistant'; content: string; photo_url?: string }

const HEALTH_COLOR: Record<string, string> = {
  thriving: 'text-green-400',
  healthy: 'text-green-500',
  needs_attention: 'text-amber-500',
  alert: 'text-red-400',
  dormant: 'text-stone-400',
}

const QUICK_QUESTIONS = [
  'What can I plant right now?',
  'I want to grow tomatoes',
  'How does the planner work?',
  'What are companion plants?',
  'Help me start a garden',
]

export default function ChatIndexPage() {
  const supabase = createClient()
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [photoType, setPhotoType] = useState<string>('image/jpeg')

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setPhotoPreview(dataUrl)
      setPhotoBase64(dataUrl.split(',')[1])
      setPhotoType(file.type || 'image/jpeg')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  function clearPhoto() {
    setPhotoPreview(null)
    setPhotoBase64(null)
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: plantData } = await supabase
        .from('plants')
        .select('id, common_name, latin_name, emoji, health_status, day_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setPlants(plantData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if ((!text.trim() && !photoBase64) || sending) return
    setSending(true)
    const msgText = text.trim() || (photoBase64 ? 'What do you see in this photo?' : '')
    setInput('')

    const tempId = Date.now().toString()
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: msgText, photo_url: photoPreview ?? undefined }])
    const typingId = `typing-${tempId}`
    setMessages(prev => [...prev, { id: typingId, role: 'assistant', content: '...' }])

    const sentBase64 = photoBase64
    const sentType = photoType
    clearPhoto()

    try {
      // Build history from existing messages (exclude typing indicators)
      const history = messages
        .filter(m => m.content !== '...')
        .map(m => ({ role: m.role, content: m.content }))

      const response = await sendGeneralChat(supabase, msgText, history,
        sentBase64 ? { photo_base64: sentBase64, media_type: sentType } : undefined
      )

      setMessages(prev =>
        prev.filter(m => m.id !== typingId).concat({
          id: `ai-${tempId}`,
          role: 'assistant',
          content: response.message,
        })
      )

      if (response.xp_earned > 0) {
        toast.success(`+${response.xp_earned} XP`)
      }

      // If a plant was added from the chat
      if (response.added_plant) {
        toast.success(`${response.added_plant.emoji} ${response.added_plant.common_name} added to your garden! +10 XP`)
        // Refresh plant list
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: plantData } = await supabase
            .from('plants')
            .select('id, common_name, latin_name, emoji, health_status, day_count')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          setPlants(plantData ?? [])
        }
      }
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== typingId))
      toast.error(err.message ?? 'Could not send message')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-green-ink text-3xl font-black tracking-tight">Chat with Sprout</h1>
          <p className="text-green-700 text-sm font-body mt-1">Your AI gardening companion — ask anything</p>
        </div>
        <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={64} height={64} className="animate-bob object-contain" />
      </div>

      {/* General Chat */}
      <section className="mb-8">
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto px-4 py-4 space-y-3 bg-green-50/30">
            {messages.length === 0 ? (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 flex-shrink-0 mt-1">
                  <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={28} height={28} className="rounded-full object-contain" />
                </div>
                <div className="bg-white border border-green-100 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm max-w-[85%]">
                  <p className="text-green-900 font-body text-sm leading-relaxed">
                    Hey there! I&apos;m Sprout 🌱 I&apos;m your AI gardening expert. Ask me what to plant, how to fix a pest problem, or even say &quot;I want to grow tomatoes&quot; and I&apos;ll add them to your garden!
                  </p>
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 flex-shrink-0 mt-1">
                      <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={28} height={28} className="rounded-full object-contain" />
                    </div>
                  )}
                  <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm font-body leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-green-700 text-white rounded-tr-sm'
                      : msg.content === '...'
                        ? 'bg-white border border-green-100 text-green-400 rounded-tl-sm'
                        : 'bg-white border border-green-100 text-green-900 rounded-tl-sm shadow-sm'
                    }`}>
                    {msg.photo_url && (
                      <img src={msg.photo_url} alt="Photo" className="rounded-lg mb-2 max-h-48 w-auto" />
                    )}
                    {msg.content === '...' ? (
                      <span className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                      </span>
                    ) : msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length < 3 && (
            <div className="flex gap-2 px-4 py-2 overflow-x-auto border-t border-green-100 bg-white">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => sendMessage(q)} disabled={sending}
                  className="flex-shrink-0 text-xs font-body font-semibold text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Photo preview */}
          {photoPreview && (
            <div className="px-4 py-2 bg-white border-t border-green-100">
              <div className="relative inline-block">
                <img src={photoPreview} alt="Upload preview" className="h-20 rounded-lg border border-green-200" />
                <button onClick={clearPhoto}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 bg-white border-t border-green-100 flex gap-2">
            <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleFileSelect} />
            <button onClick={() => fileRef.current?.click()} disabled={sending}
              className="bg-green-50 hover:bg-green-100 border border-green-200 text-green-600 px-3 py-2.5 rounded-xl transition-colors flex-shrink-0 disabled:opacity-40">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Ask Sprout anything about gardening..."
              className="flex-1 bg-green-50 border border-green-200 text-green-900 placeholder-green-400 font-body text-sm px-4 py-2.5 rounded-xl outline-none focus:border-green-500 transition-colors"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={(!input.trim() && !photoBase64) || sending}
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
      </section>

      {/* Plant Conversations */}
      {!loading && plants.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display text-green-ink text-lg font-black mb-3 flex items-center gap-2">
            <span>🌱</span> Chat About Your Plants
          </h2>
          <div className="grid gap-2">
            {plants.map(plant => (
              <Link key={plant.id} href={`/chat/${plant.id}`}
                className="flex items-center gap-3 bg-white border border-green-100 hover:border-green-300 rounded-xl px-4 py-3 transition-all hover:shadow-md group">
                <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center text-2xl transition-colors">
                  {plant.emoji ?? '🌿'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-bold text-green-ink text-sm truncate">{plant.common_name}</p>
                  <p className={`text-xs font-body font-semibold ${HEALTH_COLOR[plant.health_status] ?? 'text-green-500'}`}>
                    {plant.health_status.replace('_', ' ')} · Day {plant.day_count}
                  </p>
                </div>
                <span className="text-green-400 group-hover:text-green-600 transition-colors text-sm">💬</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* No plants prompt */}
      {!loading && plants.length === 0 && (
        <section className="mb-8">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <p className="text-green-700 font-body text-sm mb-3">
              No plants yet! Ask Sprout above to add one — try &quot;I want to grow basil&quot; — or identify a plant with a photo.
            </p>
            <Link href="/identify"
              className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-body font-bold text-sm px-5 py-2.5 rounded-xl transition-all hover:-translate-y-px">
              🔍 Identify a Plant with Photo
            </Link>
          </div>
        </section>
      )}

      {/* App Guide */}
      <section>
        <h2 className="font-display text-green-ink text-lg font-black mb-3 flex items-center gap-2">
          <span>📖</span> How SPROUT Works
        </h2>
        <div className="grid gap-2">
          {[
            { icon: '🔍', title: 'Identify a Plant', desc: 'Snap a photo and Sprout identifies it instantly with zone-specific care tips.', href: '/identify' },
            { icon: '🌿', title: 'Your Garden', desc: 'Track all your plants — health, watering schedules, and day counts.', href: '/garden' },
            { icon: '🤝', title: 'Companion Planting', desc: 'Find out which plants grow better together and which to keep apart.', href: '/companions' },
            { icon: '📐', title: 'Garden Planner', desc: 'AI-designed layouts with plant lists, companion guilds, and build plans.', href: '/planner' },
            { icon: '🏆', title: 'Rewards & XP', desc: 'Earn XP by chatting, identifying, planning, and keeping your streak.', href: '/rewards' },
          ].map(tip => (
            <Link key={tip.href} href={tip.href}
              className="flex items-start gap-3 bg-white border border-green-100 hover:border-green-300 rounded-xl px-4 py-3 transition-all hover:shadow-md group">
              <span className="text-xl mt-0.5">{tip.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-body font-bold text-green-ink text-sm">{tip.title}</p>
                <p className="text-green-600 font-body text-xs leading-relaxed mt-0.5">{tip.desc}</p>
              </div>
              <span className="text-green-300 group-hover:text-green-500 transition-colors mt-1">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
