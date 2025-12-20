import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "", // <--- ADD THIS LINE (Makes paths relative, e.g. "./script.js")
  build: {
    outDir: "../../../widgets/Receipt_Review/app",
    emptyOutDir: true,
  },
});
