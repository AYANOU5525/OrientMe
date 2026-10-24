import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Les appels /api sont relayés au serveur Express : pas de CORS ni d'URL en dur en développement
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
