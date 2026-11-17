import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/postcss';
export default defineConfig({
  publicDir: '../web/public',
  server: { fs: { allow: ['../..'] } },
  css: { postcss: { plugins: [tailwindcss()] } },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rolldownOptions: {
      onwarn(warning, warn) {
        if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') warn(warning);
      },
    },
  },
});
