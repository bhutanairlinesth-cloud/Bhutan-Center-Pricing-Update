import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/admin/',
  plugins: [react()],
  server: { port: 3001, host: '0.0.0.0' },
  build: {
    outDir: fileURLToPath(new URL('../public/admin', import.meta.url)),
    emptyOutDir: true,
  },
});
