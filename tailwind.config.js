/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // All colors reference CSS custom properties so dark/light themes work
        // without touching component className strings.
        bg: {
          primary: 'rgb(var(--bg-primary) / <alpha-value>)',
          secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
          card: 'rgb(var(--bg-card) / <alpha-value>)',
          'card-active': 'rgb(var(--bg-card-active) / <alpha-value>)',
          'card-day':    'rgb(var(--bg-card-day) / <alpha-value>)',
          'card-night':  'rgb(var(--bg-card-night) / <alpha-value>)',
        },
        accent: {
          green: 'rgb(var(--accent-green) / <alpha-value>)',
          'green-dim': 'rgb(var(--accent-green) / 0.10)',
          'green-border': 'rgb(var(--accent-green) / 0.42)',
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border-color) / <alpha-value>)',
          active: 'rgb(var(--accent-green) / 0.42)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgb(var(--accent-green) / 0.2), 0 0 60px rgb(var(--accent-green) / 0.07)',
        'glow-green-sm': '0 0 10px rgb(var(--accent-green) / 0.15)',
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
