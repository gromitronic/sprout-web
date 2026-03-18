'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null)
  const supabase = createClient()

  async function signIn(provider: 'apple' | 'google') {
    setLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      toast.error(error.message)
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-green-950 flex flex-col items-center justify-center px-6 grain-overlay">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-green-700/8 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Mascot */}
        <div className="mb-6">
          <Image
            src="/mascots/sproutbase.png"
            alt="Sprout"
            width={100}
            height={100}
            className="drop-shadow-[0_8px_32px_rgba(61,112,72,0.5)] animate-bob"
            priority
          />
        </div>

        {/* Brand */}
        <h1 className="font-display text-white text-4xl font-black tracking-tight mb-1">
          SPROUT
        </h1>
        <p className="text-green-500 text-sm font-body mb-10 text-center">
          AI Gardening by Gromitron
        </p>

        {/* Card */}
        <div className="w-full bg-green-900/40 border border-green-800/50 rounded-2xl p-8">
          <h2 className="font-display text-white text-xl font-black text-center mb-2">
            Welcome to your garden
          </h2>
          <p className="text-green-500 text-sm font-body text-center mb-8 leading-relaxed">
            Sign in to start growing. Your garden syncs across all your devices.
          </p>

          {/* Sign in with Apple — disabled until Apple Developer setup is complete
          <button
            onClick={() => signIn('apple')}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-60 text-black font-body font-bold text-base py-4 px-6 rounded-xl transition-all duration-200 hover:-translate-y-px mb-3"
          >
            {loading === 'apple' ? (
              <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            )}
            Continue with Apple
          </button>
          */}

          {/* Sign in with Google */}
          <button
            onClick={() => signIn('google')}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-60 text-black font-body font-bold text-base py-4 px-6 rounded-xl transition-all duration-200 hover:-translate-y-px"
          >
            {loading === 'google' ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          <p className="text-green-700 text-xs font-body text-center mt-6 leading-relaxed">
            By continuing, you agree to Gromitron's Terms of Service and Privacy Policy.
          </p>
        </div>

        {/* Back to site */}
        <a href="/" className="mt-8 text-green-600 hover:text-green-400 text-sm font-body transition-colors">
          ← Back to SPROUT
        </a>
      </div>
    </main>
  )
}
