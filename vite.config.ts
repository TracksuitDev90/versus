import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` must match the GitHub repo name so assets resolve on GitHub Pages
// (served from https://<user>.github.io/versus/). For local dev Vite ignores it.
export default defineConfig({
  base: '/versus/',
  plugins: [react()],
})
