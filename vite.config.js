import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["semiacidic-glycosidic-federico.ngrok-free.dev"],
    port: 3000,
    proxy: {
      // Forward all /api/* requests to the Express backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Forward Socket.io handshakes and WS upgrades
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})

