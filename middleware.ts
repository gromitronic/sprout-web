// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected routes — redirect to login if not authed
  const isAppRoute = pathname.startsWith('/garden') ||
    pathname.startsWith('/identify') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/today') ||
    pathname.startsWith('/companions') ||
    pathname.startsWith('/planner') ||
    pathname.startsWith('/rewards') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/ecosystem') ||
    pathname.startsWith('/animals')

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authed users away from login
  if ((pathname === '/login') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/garden'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|mascots|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
