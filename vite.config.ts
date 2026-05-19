import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => ({
  base: mode === 'production' ? '/stock/' : '/',
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
        target: 'https://administracionuser.uy',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 3000,
  },
}));
// Cache invalidated
