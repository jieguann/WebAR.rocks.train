import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.glb', '**/*.hdr'],
  plugins: [react()],
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    cors: {
      origin: ['https://f398-142-59-163-4.ngrok-free.app'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    },
    https: false,
    allowedHosts: ['f398-142-59-163-4.ngrok-free.app', 'localhost'],
    proxy: {
      '^/api/.*': {
        target: 'https://f398-142-59-163-4.ngrok-free.app',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
