import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // <--- Forzamos el puerto 3000 para coincidir con Java
    open: true, // Abre el navegador automáticamente
  }
})