import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/Project-Web2024/', // ✅ ต้องตั้งให้ตรงกับชื่อ repo บน GitHub Pages
})
