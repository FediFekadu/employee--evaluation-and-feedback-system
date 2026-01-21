import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Provide fallbacks for Node.js globals in browser environment
    global: 'globalThis',
  },
  server: {
    port: 5174,
    host: true,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  // Handle environment variables
  envPrefix: ['VITE_', 'REACT_APP_'],
  // Ensure compatibility with older React apps that expect process.env
  optimizeDeps: {
    include: ['laravel-echo', 'pusher-js']
  }
})