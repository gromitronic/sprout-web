import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'SPROUT — Your Whole Farm, Powered by AI',
  description: 'From backyard gardens to full homesteads — AI-powered care for your plants, animals, fish, and the connections between them. Zone-smart. Totally yours.',
  keywords: ['homestead app', 'gardening app', 'backyard chickens', 'aquaponics', 'AI farming', 'plant identification', 'USDA zones', 'companion planting', 'backyard animals'],
  openGraph: {
    title: 'SPROUT — Your Whole Farm, Powered by AI',
    description: 'Plants. Animals. Fish. All connected. All smart.',
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
