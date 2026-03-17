// lib/api/index.ts
// Typed wrappers around the three SPROUT Edge Functions

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

async function callEdgeFunction(
  fnName: string,
  token: string,
  body: Record<string, unknown>
) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Edge function error')
  return data
}

// ── Plant Chat ──────────────────────────────────────────────────────
export async function sendChatMessage(
  token: string,
  plantId: string,
  message: string,
  photoUrl?: string
): Promise<{ message: string; xp_earned: number }> {
  return callEdgeFunction('sprout-ai-chat', token, {
    plant_id: plantId,
    message,
    photo_url: photoUrl,
  })
}

// ── Plant Identification ────────────────────────────────────────────
export interface IdentifyResult {
  identified: boolean
  confidence: number
  common_name: string
  latin_name: string
  category: string
  emoji: string
  zone_fit: string
  zone_notes: string
  water_freq_days: number
  sunlight: string
  soil_ph_min: number
  soil_ph_max: number
  temp_min_f: number
  temp_max_f: number
  difficulty: string
  companions: string[]
  avoid: string[]
  sprout_says: string
  growing_tips: string
  xp_earned: number
}

export async function identifyPlant(
  token: string,
  photoBase64: string,
  mediaType = 'image/jpeg'
): Promise<IdentifyResult> {
  return callEdgeFunction('sprout-identify', token, {
    photo_base64: photoBase64,
    media_type: mediaType,
  })
}

// ── Garden Planner ──────────────────────────────────────────────────
export async function generateLayout(
  token: string,
  params: {
    width_ft: number
    length_ft: number
    space_type: string
    goals: string[]
    sun_exposure: string
    soil_type: string
    budget_range: string
    skill_level: string
    time_per_week: number
  }
): Promise<Record<string, unknown>> {
  return callEdgeFunction('sprout-planner', token, {
    action: 'generate_layout',
    ...params,
  })
}

export async function generateStructure(
  token: string,
  params: {
    structure_type: string
    width_ft: number
    length_ft: number
    height_ft?: number
    layout_id?: string
  }
): Promise<Record<string, unknown>> {
  return callEdgeFunction('sprout-planner', token, {
    action: 'generate_structure',
    ...params,
  })
}
