import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // SPROUT green system
        green: {
          ink:   '#0D1F0F',
          950:   '#142016',
          900:   '#1E3822',
          800:   '#2C5233',
          700:   '#3D7048',
          600:   '#5A9E65',
          500:   '#82C08B',
          400:   '#B8DDBC',
          300:   '#E2F2E4',
          100:   '#F2FAF3',
        },
        cream:   '#F7F2E8',
        parch:   '#EEE8D8',
        earth:   '#7C5C30',
        terra:   '#C04E28',
        amber: {
          DEFAULT: '#E9B84C',
          light:   '#FDF3D0',
        },
        sky: {
          DEFAULT: '#4A90C4',
          light:   '#E8F3FB',
        },
        sprout: {
          xp:     '#F59E0B',
          xplt:   '#FEF3C7',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body:    ['Sora', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E\")",
        'hero-gradient': 'linear-gradient(160deg, #1E3822 0%, #0D1F0F 50%, #2C5233 100%)',
        'layer-sky':    'linear-gradient(180deg, #87CEEB 0%, #B8E4F9 50%, #D4EFF9 100%)',
        'layer-canopy': 'linear-gradient(180deg, #3D7048 0%, #5A9E65 100%)',
        'layer-soil':   'linear-gradient(180deg, #7C5C30 0%, #8B6914 100%)',
        'layer-roots':  'linear-gradient(180deg, #5C3D1E 0%, #7C5C30 100%)',
        'layer-earth':  'linear-gradient(180deg, #2C1A0E 0%, #3D2810 100%)',
      },
      animation: {
        'bob':       'bob 4s ease-in-out infinite',
        'pulse-dot': 'pulseDot 2.2s ease-in-out infinite',
        'xp-pop':    'xpPop 0.6s cubic-bezier(0.68,-0.55,0.265,1.55) forwards',
        'fade-up':   'fadeUp 0.5s ease both',
        'scan':      'scanLine 2s linear infinite',
      },
      keyframes: {
        bob: {
          '0%,100%': { transform: 'translateY(0) rotate(-1.5deg)' },
          '50%':     { transform: 'translateY(-8px) rotate(1.5deg)' },
        },
        pulseDot: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.4' },
        },
        xpPop: {
          '0%':   { opacity: '0', transform: 'translateY(0) scale(0.5)' },
          '60%':  { opacity: '1', transform: 'translateY(-24px) scale(1.1)' },
          '100%': { opacity: '0', transform: 'translateY(-48px) scale(0.8)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scanLine: {
          '0%':   { top: '0%' },
          '100%': { top: '100%' },
        },
      },
      boxShadow: {
        'sprout-sm': '0 2px 10px rgba(13,31,15,0.09)',
        'sprout-md': '0 6px 28px rgba(13,31,15,0.13)',
        'sprout-lg': '0 18px 56px rgba(13,31,15,0.18)',
        'sprout-xl': '0 36px 88px rgba(13,31,15,0.24)',
        'glow-green': '0 0 32px rgba(90,158,101,0.4)',
      },
    },
  },
  plugins: [],
}
export default config
