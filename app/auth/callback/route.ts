import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/garden'

  if (!code) {
    return NextResponse.redirect(new URL('/login', requestUrl.origin))
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Exchange the code for a session
  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

  if (sessionError) {
    console.error('Session exchange error:', sessionError)
    return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
  }

  // Get the user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=no_user', requestUrl.origin))
  }

  // Check if profile exists — use maybeSingle() so missing profile is null, not an error
  const { data: profile } = await supabase
    .from('sprout_profiles')
    .select('usda_zone')
    .eq('id', user.id)
    .maybeSingle()

  // New user (no profile) → onboarding
  // Existing user with no zone set → onboarding
  // Existing user with zone → garden
  const destination = profile?.usda_zone ? next : '/onboarding'

  return NextResponse.redirect(new URL(destination, requestUrl.origin))
}
