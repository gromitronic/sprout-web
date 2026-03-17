// app/layout.tsx
import type { Metadata } from 'next'
import { Fraunces, Sora } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SPROUT — AI Gardening by Gromitron',
  description: 'Turn any gardener into a plant expert. AI-powered plant identification, zone-matched care, and companion planting — all in one place.',
  keywords: ['gardening app', 'plant identification', 'AI gardening', 'USDA zones', 'companion planting'],
  openGraph: {
    title: 'SPROUT — AI Gardening by Gromitron',
    description: 'Grow smarter. Grow anywhere.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${sora.variable}`}>
      <body className="bg-cream font-body text-green-ink antialiased">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1E3822',
              color: '#B8DDBC',
              fontFamily: 'var(--font-sora)',
              fontSize: '14px',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  )
}
