/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#05080d',       // near-black cold base
          secondary: '#090c15',     // bottom bar / secondary panel
          card: '#0d1120',          // card surface
          'card-active': '#0b1c0c', // green-tinted active card
        },
        accent: {
          green: '#4ade80',
          'green-dim': 'rgba(74,222,128,0.10)',
          'green-border': 'rgba(74,222,128,0.42)',
        },
        text: {
          primary: '#e6eeff',       // cool near-white
          secondary: '#8caabf',     // blue-gray
          muted: '#5f7d97',         // readable muted (~5:1 contrast)
        },
        border: {
          DEFAULT: '#182030',       // dark blue-black border
          active: 'rgba(74,222,128,0.42)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(74,222,128,0.2), 0 0 60px rgba(74,222,128,0.07)',
        'glow-green-sm': '0 0 10px rgba(74,222,128,0.15)',
      },
      borderRadius: {
        card: '16px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
