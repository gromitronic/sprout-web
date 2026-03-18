import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'SPROUT — AI Gardening by Gromitron',
  description: 'Turn any gardener into a plant expert. AI-powered plant identification, zone-matched care, and companion planting — all in one place.',
  keywords: ['gardening app', 'plant identification', 'AI gardening', 'USDA zones', 'companion planting'],
  openGraph: {
    title: 'SPROUT — AI Gardening by Gromitron',
    description: 'Grow smarter. Grow anywhere.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Sora:wght@100..800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-cream font-body text-green-ink antialiased">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1E3822',
              color: '#B8DDBC',
              fontFamily: 'Sora, system-ui, sans-serif',
              fontSize: '14px',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  )
}
