import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  define: {
    __APP_BUILD_ID__: JSON.stringify(
      process.env.GITHUB_SHA || process.env.VITE_BUILD_ID || 'dev-local',
    ),
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
