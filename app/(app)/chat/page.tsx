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
  'What can I plant right now?',
  'How do I identify a plant?',
  'How does the planner work?',
  'What are companion plants?',
  'How do I earn XP?',
]

const APP_TIPS = [
  { icon: '🔍', title: 'Identify a Plant', desc: 'Snap a photo and Sprout identifies it instantly with zone-specific care tips.', href: '/identify' },
  { icon: '🌿', title: 'Your Garden', desc: 'Track all your plants — health, watering schedules, and day counts.', href: '/garden' },
  { icon: '🤝', title: 'Companion Planting', desc: 'Find out which plants grow better together and which to keep apart.', href: '/companions' },
  { icon: '📐', title: 'Garden Planner', desc: 'AI-designed layouts with plant lists, companion guilds, and build plans.', href: '/planner' },
  { icon: '🏆', title: 'Rewards & XP', desc: 'Earn XP by chatting, identifying, planning, and keeping your streak.', href: '/rewards' },
]

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
        supabase.from('plants').select('id, common_name, latin_name, emoji, health_status, day_count').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('usda_zone').eq('id', user.id).single(),
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
    const typingId = `typing-${tempId}`
    setMessages(prev => [...prev, { id: typingId, role: 'assistant', content: '...' }])

    // Use local fallback since the edge function requires a plant_id
    // In v2 we can add a general chat edge function
    const reply = getLocalResponse(text, zone)
    // Small delay to feel natural
    await new Promise(r => setTimeout(r, 600))

    setMessages(prev =>
      prev.filter(m => m.id !== typingId).concat({
        id: `ai-${tempId}`,
        role: 'assistant',
        content: reply,
      })
    )
    setSending(false)
    inputRef.current?.focus()
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
                    Hey there! I&apos;m Sprout 🌱 Ask me anything about gardening, how to use the app, or what to plant this season. Try one of the quick questions below!
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

      {/* No plants prompt */}
      {!loading && plants.length === 0 && (
        <section className="mb-8">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <p className="text-green-700 font-body text-sm mb-3">
              Add your first plant to get personalized AI chat about its care!
            </p>
            <Link href="/identify"
              className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-body font-bold text-sm px-5 py-2.5 rounded-xl transition-all hover:-translate-y-px">
              🔍 Identify Your First Plant
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

/** Smart local responses for the general Sprout chat */
function getLocalResponse(question: string, zone: string | null): string {
  const q = question.toLowerCase()
  const zoneInfo = zone ? ` You're in Zone ${zone}, so I'll tailor my advice accordingly!` : ' Head to Settings to set your USDA zone for personalized recommendations.'

  // Greetings
  if (q.match(/^(hi|hey|hello|yo|sup|what'?s up|howdy)/))
    return `Hey there! 👋 I'm Sprout, your gardening buddy. I can help you figure out what to plant, how to use any feature in the app, or answer care questions about your plants. What's on your mind?`

  // Identity / photo
  if (q.includes('identify') || q.includes('photo') || q.includes('snap') || q.includes('scan') || q.includes('what plant'))
    return `To identify a plant, tap the 🔍 Identify tab in the sidebar. Upload or snap a photo and I'll tell you the species, care requirements, zone compatibility, and companion plants — all in seconds! You'll earn +15 XP too. Once identified, you can add it to your garden with one tap.`

  // Planner
  if (q.includes('planner') || q.includes('layout') || q.includes('design') || q.includes('plan'))
    return `The Garden Planner (📐) is super powerful! Enter your space dimensions, goals (food, flowers, pollinators, etc.), sun exposure, and skill level. I'll generate a complete layout with plant suggestions, companion guilds, and seasonal tips. There's also a Structure Builder for raised beds, trellises, cold frames — with full materials lists, cut lists, and step-by-step instructions. +30 XP per plan!`

  // Companion planting
  if (q.includes('companion') || q.includes('together') || q.includes('pair') || q.includes('guild'))
    return `Companion planting is about which plants help each other thrive! 🤝 Head to the Companions tab to look up any plant. Classic examples: basil + tomatoes repel pests, marigolds protect everything, and beans fix nitrogen for hungry feeders. I'll also warn you about bad combos — like fennel, which fights with almost everything!`

  // XP / rewards / badges / streak
  if (q.includes('xp') || q.includes('reward') || q.includes('level') || q.includes('streak') || q.includes('badge') || q.includes('earn'))
    return `Here's how you earn XP in SPROUT! 💪 Chatting about a plant: +3 XP. Identifying a plant: +15 XP. Adding to garden: +10 XP. Generating a layout or build plan: +30 XP each. Keep logging in daily to build your streak — check the 🏆 Rewards tab for badges like "Green Thumb" and "Master Planner"!`

  // What to plant / season / now
  if (q.includes('plant') && (q.includes('now') || q.includes('this month') || q.includes('season') || q.includes('right now') || q.includes('today') || q.includes('spring') || q.includes('march')))
    return `Great question!${zoneInfo} In mid-March, cool-season crops are your best bet — think lettuce, spinach, peas, radishes, and kale. If you want flowers, pansies and snapdragons love cool weather. Use the 📐 Garden Planner to get a personalized layout for your exact space and goals!`

  // Garden page
  if (q.includes('garden') && (q.includes('how') || q.includes('what') || q.includes('where') || q.includes('my')))
    return `Your Garden (🌿) is home to all your plants! After identifying a plant, tap "Add to Garden" and it'll appear here with health tracking, watering reminders, and a day counter. Tap any plant to open a 1-on-1 chat with me about its specific needs.`

  // Watering
  if (q.includes('water'))
    return `Watering depends on the plant, soil, and weather! As a general rule: most veggies like 1-1.5 inches per week, and it's better to water deeply less often than a little every day. Add a plant to your garden and I can give you specific watering advice tailored to your zone and conditions. 💧`

  // Soil
  if (q.includes('soil') || q.includes('dirt') || q.includes('compost'))
    return `Good soil is the foundation of a great garden! 🌍 For raised beds, Mel's Mix is hard to beat: 1/3 compost, 1/3 peat moss (or coco coir), 1/3 vermiculite. For in-ground beds, work in 2-3 inches of compost each season. The Garden Planner's Structure Builder will calculate exact soil quantities for your beds!`

  // Pests
  if (q.includes('pest') || q.includes('bug') || q.includes('insect') || q.includes('aphid'))
    return `Pest management starts with prevention! 🐛 Companion planting is your first line of defense — marigolds, basil, and nasturtiums all deter common pests. Neem oil spray works for most soft-bodied insects. For specific pest issues, add the affected plant to your garden and chat with me about it — I can diagnose from photos too!`

  // How the app works (general)
  if (q.includes('how') && (q.includes('app') || q.includes('work') || q.includes('use') || q.includes('sprout')))
    return `SPROUT has everything you need! 🌱 **Identify** plants with photos, track them in your **Garden**, get AI advice via **Chat**, find **Companion** plant combos, design layouts in the **Planner**, check daily tasks in **Today**, and earn XP in **Rewards**. The best way to start: identify your first plant with a photo! Tap 🔍 in the sidebar.`

  // Fallback — more conversational
  return `That's a great question! 🌿 I can help with plant care, what to grow in your zone, companion planting, using any feature in the app, or building garden structures. You can also add a plant to your garden (via 🔍 Identify) and I'll give you super specific care advice for it. What would you like to explore?`
}
