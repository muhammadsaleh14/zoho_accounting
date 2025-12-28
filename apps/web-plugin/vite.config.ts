// File: contracts/tax-demo-apps/zoho_accounting/apps/web-plugin/vite.config.ts

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
  base: "/zoho_accounting/",
  build: {
    // Use a relative path so it works everywhere
    outDir: "dist", 
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
