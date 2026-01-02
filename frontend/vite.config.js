import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/signup': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/start': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/answer': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/set_game_settings': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/player_sessions_stats': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/top_players': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    }
  },
  build: {
    outDir: '../static/react',
    emptyOutDir: true,
  }
})

