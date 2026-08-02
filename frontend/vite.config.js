import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Forward API calls to the backend in local development, mirroring how
      // nginx proxies "/api" to the app tier in production.
      "/api": "http://localhost:5000",
    },
  },
})
