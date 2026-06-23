import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: 'frontend',
  envDir: '../',
  server: {
    proxy: {
      // Redirige todas las llamadas /api al backend
      '/api': 'http://localhost:3000',
    },
  },
})
