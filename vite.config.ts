import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// For GitHub Pages, the build path is `/<repo-name>/`.
// Override via env var `VITE_BASE` for forks with a different repo name,
// or set to '/' for custom domain / local preview.
const base = process.env.VITE_BASE ?? '/signal-playground/';

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    chunkSizeWarningLimit: 1500
  },
  server: {
    port: 5173,
    open: true
  }
});
