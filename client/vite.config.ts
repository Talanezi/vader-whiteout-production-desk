import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  optimizeDeps: { exclude: ['pdfjs-dist'] },
  plugins: [react()],
  base: '/productiondesk/',
  server: {
    port: 5173,
  },
})
