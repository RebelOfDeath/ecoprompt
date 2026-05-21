import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/api/greenpt': {
        target: 'https://api.greenpt.ai',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/greenpt/, '/v1'),
        configure: proxy => {
          // GreenPT 403s browser requests that include Origin/Referer headers.
          // Strip them so the proxied request looks like a direct API call.
          proxy.on('proxyReq', proxyReq => {
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
          })
        },
      },
    },
  },
})
