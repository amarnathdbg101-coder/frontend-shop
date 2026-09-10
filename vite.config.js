import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip', exclude: [/\.(br)$/, /\.(gz)$/] }),
  ],
  server: {
    port: 5173,
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('axios')) {
              return 'vendor-network';
            }
            return 'vendor-libs';
          }
        },
      },
    },
  },
})
