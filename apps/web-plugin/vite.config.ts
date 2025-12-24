import path from "path"
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ["polemoniaceous-disclamatory-brett.ngrok-free.dev"],
  },
  base: "/zoho_accounting/", // <--- ADD THIS LINE (Makes paths relative, e.g. "./script.js")
  build: {
    outDir: "E:/project/receipt-monorepo/apps/web-plugin/dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
