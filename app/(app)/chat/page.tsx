'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Plant = {
  id: string
  common_name: string
  latin_name: string
  emoji: string
  health_status: string
  day_count: number
}

type Message = { id: string; role: 'user' | 'assistant'; content: string }

const HEALTH_COLOR: Record<string, string> = {
  thriving: 'text-green-400',
  healthy: 'text-green-500',
  needs_attention: 'text-amber-500',
  alert: 'text-red-400',
  dormant: 'text-stone-400',
}

const QUICK_QUESTIONS = [
  'What can I plant this month?',
  'How does the garden planner work?',
  'How do I identify a plant?',
  'What are companion plants?',
  'How do I earn XP?',
]

const APP_TIPS = [
  {
    icon: '🔍',
    title: 'Identify a Plant',
    desc: 'Go to Identify, snap a photo, and Sprout will tell you exactly what it is — plus zone-specific care tips.',
    href: '/identify',
  },
  {
    icon: '🌿',
    title: 'Your Garden',
    desc: 'All your identified and added plants live here. Track health, watering schedules, and day counts.',
    href: '/garden',
  },
  {
    icon: '🤝',
    title: 'Companion Planting',
    desc: 'Find out which plants grow better together — and which ones to keep apart.',
    href: '/companions',
  },
  {
    icon: '📐',
    title: 'Garden Planner',
    desc: 'Design your garden layout with AI. Get a plant list, companion guilds, and seasonal tips.',
    href: '/planner',
  },
  {
    icon: '🏆',
    title: 'Rewards & XP',
    desc: 'Earn XP by chatting, identifying plants, planning gardens, and keeping your streak alive.',
    href: '/rewards',
  },
]

const SPROUT_KNOWLEDGE = `You are Sprout, a friendly AI gardening assistant built by Gromitron.
You help users navigate the SPROUT app and answer gardening questions.

ABOUT THE SPROUT APP:
- **Identify**: Upload or snap a photo of any plant. Sprout uses AI to identify it with 97% accuracy, shows care info, zone fit, companions, and lets you add it to your garden.
- **Garden**: Your personal plant collection. See all your plants, their health status, day count since planting, and watering schedules.
- **Chat**: Each plant gets its own AI conversation. Ask about watering, pests, harvesting, companions — Sprout knows your specific plant, zone, and conditions.
- **Companions**: Look up which plants grow better together and which to keep apart. The companion planting engine maps synergies tuned to your zone.
- **Planner**: AI garden layout designer. Enter your space dimensions, goals, sun exposure, and skill level. Sprout generates a complete layout with plant list, companion guilds, and seasonal tips. There's also a Structure Builder for raised beds, trellises, cold frames, and more — with materials lists, cut lists, and step-by-step build instructions.
- **Today**: Your daily gardening dashboard with tasks, weather, and what needs attention.
- **Rewards**: Earn XP by chatting (+3 XP), identifying plants (+15 XP), adding to garden (+10 XP), planning layouts (+30 XP), and building structures (+30 XP). Level up, earn badges, and keep your daily streak alive.

GUIDELINES:
- Be warm, encouraging, and concise (2-4 sentences unless they ask for detail)
- If they ask about a feature, explain how to use it and offer to guide them
- For gardening questions, give zone-aware advice when you know their zone
- Use garden-related emojis sparingly for warmth
- Stay on topic — gardening and the SPROUT app only`

export default function ChatIndexPage() {
  const supabase = createClient()
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [zone, setZone] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: plantData }, { data: profile }] = await Promise.all([
        supabase
          .from('plants')
          .select('id, common_name, latin_name, emoji, health_status, day_count')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('usda_zone')
          .eq('id', user.id)
          .single(),
      ])

      setPlants(plantData ?? [])
      setZone(profile?.usda_zone ?? null)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return
    setSending(true)
    setInput('')

    const tempId = Date.now().toString()
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: text }])

    // Typing indicator
    const typingId = `typing-${tempId}`
    setMessages(prev => [...prev, { id: typingId, role: 'assistant', content: '...' }])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not signed in')

      // Build conversation history for context
      const history = messages.map(m => ({ role: m.role, content: m.content }))

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      const res = await fetch(`${SUPABASE_URL}/functions/v1/sprout-ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          general_chat: true,
          message: text,
          history,
          user_zone: zone,
          system_override: SPROUT_KNOWLEDGE,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // If the edge function doesn't support general chat yet, use a local fallback
        throw new Error(data.error ?? 'Chat error')
      }

      setMessages(prev =>
        prev.filter(m => m.id !== typingId).concat({
          id: `ai-${tempId}`,
          role: 'assistant',
          content: data.message,
        })
      )
    } catch {
      // Fallback: provide helpful responses locally if the edge function doesn't handle general chat
      const fallback = getLocalResponse(text)
      setMessages(prev =>
        prev.filter(m => m.id !== typingId).concat({
          id: `ai-${tempId}`,
          role: 'assistant',
          content: fallback,
        })
      )
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
          <h1 className="font-display text-green-ink text-3xl font-black tracking-tight">
            Chat with Sprout
          </h1>
          <p className="text-green-700 text-sm font-body mt-1">
            Your AI gardening companion — ask anything
          </p>
        </div>
        <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={64} height={64} className="animate-bob" />
      </div>

      {/* General Chat */}
      <section className="mb-8">
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Chat messages */}
          <div className="max-h-[400px] overflow-y-auto px-4 py-4 space-y-3 bg-green-50/30">
            {messages.length === 0 ? (
              <div className="flex gap-2.5">
                <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={28} height={28} className="flex-shrink-0 mt-1 rounded-full" />
                <div className="bg-white border border-green-100 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm max-w-[85%]">
                  <p className="text-green-900 font-body text-sm leading-relaxed">
                    Hey there! I&apos;m Sprout 🌱 Ask me anything about gardening or how to use the app. I&apos;m here to help!
                  </p>
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={28} height={28} className="flex-shrink-0 mt-1 rounded-full" />
                  )}
                  <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm font-body leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-green-700 text-white rounded-tr-sm'
                      : msg.content === '...'
                        ? 'bg-white border border-green-100 text-green-400 rounded-tl-sm'
                        : 'bg-white border border-green-100 text-green-900 rounded-tl-sm shadow-sm'
                    }`}>
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
          {messages.length < 2 && (
            <div className="flex gap-2 px-4 py-2 overflow-x-auto border-t border-green-100 bg-white">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => sendMessage(q)} disabled={sending}
                  className="flex-shrink-0 text-xs font-body font-semibold text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 bg-white border-t border-green-100 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Ask Sprout anything..."
              className="flex-1 bg-green-50 border border-green-200 text-green-900 placeholder-green-400 font-body text-sm px-4 py-2.5 rounded-xl outline-none focus:border-green-500 transition-colors"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending}
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

      {/* App Guide */}
      <section>
        <h2 className="font-display text-green-ink text-lg font-black mb-3 flex items-center gap-2">
          <span>📖</span> How SPROUT Works
        </h2>
        <div className="grid gap-2">
          {APP_TIPS.map(tip => (
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

/** Local fallback responses when edge function doesn't support general chat */
function getLocalResponse(question: string): string {
  const q = question.toLowerCase()

  if (q.includes('identify') || q.includes('photo') || q.includes('snap'))
    return 'To identify a plant, head to the Identify tab (🔍). Upload or snap a photo and I\'ll tell you exactly what it is — species, care needs, zone fit, and companion plants. You can then add it to your garden with one tap! 🌿'

  if (q.includes('planner') || q.includes('layout') || q.includes('design'))
    return 'The Garden Planner (📐) lets you design your space with AI! Enter your dimensions, goals, sun exposure, and skill level, and I\'ll generate a complete layout with plant suggestions, companion guilds, and seasonal tips. There\'s also a Structure Builder for raised beds, trellises, and more — with full materials and cut lists! 🏗️'

  if (q.includes('companion') || q.includes('together') || q.includes('pair'))
    return 'Companion planting is all about which plants help each other grow! Head to the Companions tab (🤝) to look up any plant — I\'ll show you its best friends and enemies, tuned to your zone. For example, basil and tomatoes are a classic winning pair! 🍅🌿'

  if (q.includes('xp') || q.includes('reward') || q.includes('level') || q.includes('streak') || q.includes('badge'))
    return 'You earn XP for everything you do in SPROUT! Chatting (+3 XP), identifying plants (+15 XP), adding to your garden (+10 XP), and generating plans (+30 XP). Keep your daily streak alive for bonus rewards, and check the Rewards tab (🏆) for badges! ⚡'

  if (q.includes('plant this month') || q.includes('what can i plant') || q.includes('season'))
    return 'Great question! What you can plant depends on your USDA zone and the current season. Head to the Garden Planner to get personalized suggestions for your zone, or identify a plant you\'re considering — I\'ll tell you if it\'s a good fit! 🌱'

  if (q.includes('garden') && (q.includes('how') || q.includes('what')))
    return 'Your Garden (🌿) is where all your plants live. After identifying a plant, add it to your garden to track its health, watering schedule, and day count. Tap any plant to start a conversation with me about its specific care needs!'

  return 'I\'m here to help with anything gardening-related! You can ask me about plant care, companion planting, how to use any feature in the app, or just get seasonal gardening advice. What would you like to know? 🌱'
}
