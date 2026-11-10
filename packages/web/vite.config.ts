import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// `build/` holds the deployable app the server serves; `dist/` is tsc's composite output.
export default defineConfig({
  plugins: [tailwindcss()],
  build: { outDir: 'build' },
});
