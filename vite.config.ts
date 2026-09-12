import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api/chat': {
        target: 'https://free.icomefrom.asia/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, '/chat/completions'),
        headers: {
          Authorization: 'Bearer YOUR_API_KEY_HERE',
        },
      },
    },
  },
})
