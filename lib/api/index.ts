// lib/api/index.ts
// Typed wrappers around the SPROUT Edge Functions
// Uses Supabase client's functions.invoke() for proper auth handling

import type { SupabaseClient } from '@supabase/supabase-js'

async function callEdgeFunction(
  supabase: SupabaseClient,
  fnName: string,
  body: Record<string, unknown>
) {
  const { data, error } = await supabase.functions.invoke(fnName, {
    body,
  })
  if (error) {
    // Extract real error message from the response
    let msg = 'Edge function error'
    try {
      if (error.context && typeof error.context.json === 'function') {
        const errBody = await error.context.json()
        msg = errBody?.error ?? error.message ?? msg
      } else {
        msg = error.message ?? msg
      }
    } catch {
      msg = error.message ?? msg
    }
    throw new Error(msg)
  }
  return data
}

// ── Plant Chat (plant-specific) ─────────────────────────────────────
export async function sendChatMessage(
  supabase: SupabaseClient,
  plantId: string,
  message: string,
  opts?: { photo_base64?: string; media_type?: string }
): Promise<{ message: string; xp_earned: number }> {
  return callEdgeFunction(supabase, 'sprout-ai-chat', {
    plant_id: plantId,
    message,
    photo_base64: opts?.photo_base64,
    media_type: opts?.media_type,
  })
}

// ── General Chat (no plant required) ────────────────────────────────
export interface GeneralChatResult {
  message: string
  xp_earned: number
  added_plant: { id: string; common_name: string; emoji: string } | null
}

export async function sendGeneralChat(
  supabase: SupabaseClient,
  message: string,
  history?: { role: string; content: string }[],
  opts?: { photo_base64?: string; media_type?: string }
): Promise<GeneralChatResult> {
  return callEdgeFunction(supabase, 'sprout-general-chat', {
    message,
    history,
    photo_base64: opts?.photo_base64,
    media_type: opts?.media_type,
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
  supabase: SupabaseClient,
  photoBase64: string,
  mediaType = 'image/jpeg'
): Promise<IdentifyResult> {
  return callEdgeFunction(supabase, 'sprout-identify', {
    photo_base64: photoBase64,
    media_type: mediaType,
  })
}

// ── Garden Planner ──────────────────────────────────────────────────
export async function generateLayout(
  supabase: SupabaseClient,
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
  return callEdgeFunction(supabase, 'sprout-planner', {
    action: 'generate_layout',
    ...params,
  })
}

export async function generateStructure(
  supabase: SupabaseClient,
  params: {
    structure_type: string
    width_ft: number
    length_ft: number
    height_ft?: number
    layout_id?: string
  }
): Promise<Record<string, unknown>> {
  return callEdgeFunction(supabase, 'sprout-planner', {
    action: 'generate_structure',
    ...params,
  })
}
