import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/auth': 'http://localhost:3001',
      '/courses': 'http://localhost:3001',
      '/requests': 'http://localhost:3001',
      '/matches': 'http://localhost:3001',
      '/admin': 'http://localhost:3001',
    }
  }
})
