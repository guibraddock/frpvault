import { defineConfig } from 'vite'

export default defineConfig({
  // Base URL — deixe '/' para Vercel
  base: '/',

  build: {
    outDir: 'dist',
    // Gera sourcemaps para debug em produção
    sourcemap: false,
    // Minifica JS e CSS
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },

  server: {
    port: 3000,
    open: true,
  },
})
