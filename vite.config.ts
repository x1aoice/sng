import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const targetUrl = env.FREELLMAPI_URL || 'https://free.icomefrom.asia/v1';
  const apiKey = env.FREELLMAPI_KEY || '';

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: 3000,
      proxy: {
        '/api/chat': {
          target: targetUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/chat/, '/chat/completions'),
          headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        },
      },
    },
  };
});
