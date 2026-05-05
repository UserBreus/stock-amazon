import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR can be disabled externally to avoid flicker during automated edits.
    hmr: process.env.DISABLE_HMR !== 'true',
    proxy: {
      '/api/sql': {
        target: 'http://3.85.26.173:5005/sql',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api\/sql/, ''),
      },
    },
  },
}));
// Cache invalidated
