import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/istoc-b2b-backlog/',
  plugins: [vue(), tailwindcss()],
})
