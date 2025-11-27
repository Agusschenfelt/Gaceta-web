import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separamos las librerías grandes en sus propios archivos
          vendor: ['react', 'react-dom', 'react-router-dom'],
          animations: ['gsap', '@gsap/react'],
          icons: ['lucide-react', 'react-icons']
        }
      }
    }
  }
})