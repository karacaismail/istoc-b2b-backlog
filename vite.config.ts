import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  base: '/istoc-b2b-backlog/',
  plugins: [vue(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        tasks: resolve(__dirname, 'index.html'),
        efor: resolve(__dirname, 'efor/index.html'),
      },
    },
  },
})
