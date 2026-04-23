import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens from prototype
        bg: {
          0: '#0a0e14',
          1: '#11161d',
          2: '#1a2028',
          3: '#242c38',
        },
        line: {
          DEFAULT: '#2a3442',
          2: '#3a4758',
        },
        ink: {
          0: '#e8edf3',
          1: '#a8b4c4',
          2: '#6b7788',
        },
        accent: {
          DEFAULT: '#ff7a1a',
          2: '#00d4ff',
        },
        success: '#32d583',
        warn: '#fdb022',
        danger: '#f04438',
      },
      fontFamily: {
        sans: ['var(--font-ibm-plex-arabic)', 'IBM Plex Sans Arabic', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(42,52,66,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(42,52,66,.35) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '32px 32px',
      },
    },
  },
  plugins: [],
}

export default config
