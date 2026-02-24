import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-geo': ['d3-geo', 'topojson-client'],
          'vendor-date': ['date-fns', 'date-fns-tz'],
        },
      },
    },
  },
})
