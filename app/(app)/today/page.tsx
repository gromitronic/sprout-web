'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Task = { id: string; plant_id: string; plant_name: string; emoji: string; action: string; detail: string; xp: number; urgency: 'today' | 'week' | 'upcoming'; done: boolean }

const MONTH_TIPS: Record<number, string> = {
  1: '❄️ January — Plan your season. Order seeds now for early spring.',
  2: '🌱 February — Start seeds indoors 6–8 weeks before last frost.',
  3: '🌿 March — Zone 9b+ can direct sow cold-crops now.',
  4: '🌸 April — Prime transplant season for most zones.',
  5: '☀️ May — Last frost passed in most zones. Full planting ahead!',
  6: '🍅 June — Peak growing season. Water deeply, less frequently.',
  7: '🔥 July — Heat stress watch. Mulch, shade cloth, water at dawn.',
  8: '🫐 August — Start fall crops for zones 7+.',
  9: '🍂 September — Fall planting window opens. Cool crops thrive.',
  10: '🥦 October — Brassicas and root veg love the cooler temps.',
  11: '🌾 November — Wind-down. Compost, cover crops, soil amendments.',
  12: '🪴 December — Rest, plan, and check your grow lights.',
}

function generateAnimalTasks(animals: any[]): Task[] {
  const tasks: Task[] = []
  animals.forEach(a => {
    const label = a.name ?? `${a.count} ${a.species}${a.count > 1 ? 's' : ''}`
    // Daily check-in for every animal
    tasks.push({
      id: `animal-checkin-${a.id}`,
      plant_id: a.id,
      plant_name: label,
      emoji: a.emoji ?? '🐾',
      action: 'Daily Check-in',
      detail: `Check food, water, and health`,
      xp: 8,
      urgency: 'today' as const,
      done: false,
    })
    // Production collection
    if (['eggs','milk','honey'].includes(a.produce_type ?? '')) {
      tasks.push({
        id: `animal-collect-${a.id}`,
        plant_id: a.id,
        plant_name: label,
        emoji: a.produce_type === 'eggs' ? '🥚' : a.produce_type === 'milk' ? '🥛' : '🍯',
        action: `Collect ${a.produce_type}`,
        detail: `Daily ${a.produce_type} collection`,
        xp: 15,
        urgency: 'today' as const,
        done: false,
      })
    }
    // Aquaponics water check
    if (a.housing_type === 'aquaponics') {
      tasks.push({
        id: `fish-water-${a.id}`,
        plant_id: a.id,
        plant_name: label,
        emoji: '💧',
        action: 'Check Water Quality',
        detail: 'pH, ammonia, temperature check',
        xp: 10,
        urgency: 'today' as const,
        done: false,
      })
    }
    // Health alerts
    if (a.health_status === 'alert' || a.health_status === 'needs_attention') {
      tasks.push({
        id: `animal-alert-${a.id}`,
        plant_id: a.id,
        plant_name: label,
        emoji: '⚠️',
        action: 'Health Check Needed',
        detail: 'This animal needs your attention',
        xp: 20,
        urgency: 'today' as const,
        done: false,
      })
    }
  })
  return tasks
}

const ECOSYSTEM_TIPS = [
  "💧 Drain aquaponics water onto your raised beds today — free liquid fertilizer!",
  "🐔 Collect chicken manure and add to compost. Ready to use in ~30 days.",
  "🐝 Check if your bees need water nearby — place a shallow dish with pebbles.",
  "🌿 Cut comfrey and toss it in your chicken run — free high-protein feed.",
  "🦆 Ducks love slugs — let them into the garden for 30 mins before planting.",
  "🐟 Check fish water pH today — ideal range is 6.8–7.2 for most species.",
  "🐐 Goat manure can go straight onto garden beds — it won't burn plants.",
  "🐇 Rabbit manure tea: soak pellets in water overnight, use as liquid feed.",
  "♻️ Kitchen scraps → chickens → eggs + manure → compost → plants → table!",
  "🌱 Plant a comfrey root cutting near each animal pen — living feed dispenser.",
]

function generateTasks(plants: any[]): Task[] {
  const tasks: Task[] = []
  plants.forEach(p => {
    if (p.health_status === 'alert' || p.health_status === 'needs_attention') {
      tasks.push({ id: `alert-${p.id}`, plant_id: p.id, plant_name: p.common_name, emoji: p.emoji ?? '🌿', action: 'Check Now', detail: 'Needs attention — open chat for AI diagnosis', xp: 15, urgency: 'today', done: false })
    }
    if (p.water_freq_days && p.day_count % p.water_freq_days === 0) {
      tasks.push({ id: `water-${p.id}`, plant_id: p.id, plant_name: p.common_name, emoji: p.emoji ?? '🌿', action: 'Water', detail: `Due every ${p.water_freq_days} days`, xp: 10, urgency: 'today', done: false })
    }
    tasks.push({ id: `photo-${p.id}`, plant_id: p.id, plant_name: p.common_name, emoji: p.emoji ?? '🌿', action: 'Photo Check-in', detail: 'Daily AI health monitoring', xp: 12, urgency: 'week', done: false })
  })
  return tasks.slice(0, 12)
}

export default function TodayPage() {
  const supabase = createClient()
  const [tasks,       setTasks]       = useState<Task[]>([])
  const [animalTasks, setAnimalTasks] = useState<Task[]>([])
  const [streak,      setStreak]      = useState(0)
  const [zone,        setZone]        = useState('')
  const [loading,     setLoading]     = useState(true)

  const month = new Date().getMonth() + 1
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: plants }, { data: dash }, { data: animalData }] = await Promise.all([
        supabase.from('sprout_plant_summary').select('id, common_name, emoji, health_status, day_count, water_freq_days').eq('user_id', user.id).eq('is_archived', false),
        supabase.from('sprout_user_dashboard').select('streak_current, usda_zone').eq('user_id', user.id).single(),
        supabase.from('sprout_animals').select('id, species, name, emoji, count, health_status, produce_type, housing_type').eq('user_id', user.id).eq('is_archived', false),
      ])
      setTasks(generateTasks(plants ?? []))
      setAnimalTasks(generateAnimalTasks(animalData ?? []))
      setStreak(dash?.streak_current ?? 0)
      setZone(dash?.usda_zone ?? '')
      setLoading(false)
    }
    load()
  }, [])

  async function completeTask(taskId: string, plantId: string, xp: number) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: true } : t))
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.rpc('sprout_award_xp', { p_user_id: user.id, p_amount: xp, p_multiplier: false })
    await supabase.rpc('sprout_update_streak', { p_user_id: user.id })
    await supabase.from('sprout_care_logs').insert({ user_id: user.id, plant_id: plantId, action: 'task_complete', xp_earned: xp })
    toast.success(`+${xp} XP! 🌱`)
  }

  const todayTasks    = tasks.filter(t => t.urgency === 'today')
  const weekTasks     = tasks.filter(t => t.urgency === 'week')
  const allTasks      = [...tasks, ...animalTasks]
  const doneTasks     = allTasks.filter(t => t.done).length
  const totalTasks    = allTasks.length
  const ecosystemTip  = ECOSYSTEM_TIPS[new Date().getDate() % ECOSYSTEM_TIPS.length]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-green-ink text-3xl font-black tracking-tight">Today</h1>
            <p className="text-green-700 text-sm font-body mt-0.5">{today}</p>
          </div>
          <Image src="/mascots/sproutwatering.png" alt="Sprout" width={64} height={64} className="animate-bob" />
        </div>

        {/* Streak + progress */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-orange-950/20 border border-orange-800/30 rounded-xl px-4 py-3">
            <div className="font-display text-orange-300 text-2xl font-black">🔥 {streak}</div>
            <div className="text-orange-500 text-xs font-body">day streak</div>
          </div>
          <div className="bg-green-900/20 border border-green-800/30 rounded-xl px-4 py-3">
            <div className="font-display text-green-300 text-2xl font-black">{doneTasks}/{totalTasks}</div>
            <div className="text-green-600 text-xs font-body">tasks done</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-green-900/20 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
            style={{ width: totalTasks ? `${(doneTasks / totalTasks) * 100}%` : '0%' }} />
        </div>
      </div>

      {/* Season card */}
      <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <span className="text-2xl">{zone ? '🗺️' : '📅'}</span>
        <p className="text-green-300 font-body text-sm leading-relaxed flex-1">
          <strong className="text-green-200">{zone ? `Zone ${zone} · ` : ''}</strong>
          {MONTH_TIPS[month]}
        </p>
      </div>

      {/* Ecosystem tip */}
      <div className="bg-gradient-to-br from-green-900/60 to-green-800/40 border border-green-700/30 rounded-xl px-4 py-3 flex items-start gap-3 mb-6">
        <span className="text-xl flex-shrink-0">🔄</span>
        <div>
          <p className="text-green-400 text-xs font-body font-bold uppercase tracking-wide mb-0.5">Ecosystem Tip</p>
          <p className="text-green-300 text-sm font-body leading-relaxed">{ecosystemTip}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-green-900/20 rounded-xl animate-pulse" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <Image src="/mascots/sproutsmiling.png" alt="Sprout" width={80} height={80} className="mx-auto mb-3 opacity-50" />
          <p className="text-green-700 font-body">Add some plants to see your daily tasks here!</p>
          <Link href="/identify" className="inline-block mt-4 bg-green-700 hover:bg-green-600 text-white font-body font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
            Add a Plant
          </Link>
        </div>
      ) : (
        <>
          {animalTasks.length > 0 && (
            <div className="mb-5">
              <h2 className="font-body font-bold text-green-700 text-xs uppercase tracking-widest mb-3">
                🐾 Animal Care
              </h2>
              <div className="space-y-2">
                {animalTasks.map(task => <TaskRow key={task.id} task={task} onComplete={completeTask} />)}
              </div>
            </div>
          )}
          {todayTasks.length > 0 && (
            <div className="mb-5">
              <h2 className="font-body font-bold text-green-700 text-xs uppercase tracking-widest mb-3">
                🌿 Plant Care — Today
              </h2>
              <div className="space-y-2">
                {todayTasks.map(task => <TaskRow key={task.id} task={task} onComplete={completeTask} />)}
              </div>
            </div>
          )}
          {weekTasks.length > 0 && (
            <div>
              <h2 className="font-body font-bold text-green-700 text-xs uppercase tracking-widest mb-3">
                🌿 Plant Care — This Week
              </h2>
              <div className="space-y-2">
                {weekTasks.map(task => <TaskRow key={task.id} task={task} onComplete={completeTask} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: (id: string, plantId: string, xp: number) => void }) {
  return (
    <div className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 transition-all duration-300
      ${task.done ? 'opacity-50 border-green-100' : 'border-green-100 hover:border-green-300 shadow-sprout-sm'}`}>
      <button
        onClick={() => !task.done && onComplete(task.id, task.plant_id, task.xp)}
        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
          ${task.done ? 'bg-green-500 border-green-500' : 'border-green-300 hover:border-green-500'}`}>
        {task.done && <span className="text-white text-xs">✓</span>}
      </button>

      <span className="text-2xl flex-shrink-0">{task.emoji}</span>

      <div className="flex-1 min-w-0">
        <div className={`font-body font-bold text-sm truncate ${task.done ? 'line-through text-green-400' : 'text-green-ink'}`}>
          {task.plant_name} — {task.action}
        </div>
        <div className="text-green-600 text-xs font-body truncate">{task.detail}</div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-amber-500 text-xs font-body font-bold">+{task.xp}xp</span>
        <Link href={`/chat/${task.plant_id}`}
          className="text-green-600 hover:text-green-400 text-xs font-body font-semibold transition-colors">
          💬
        </Link>
      </div>
    </div>
  )
}
