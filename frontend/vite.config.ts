import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "CardApp - Carte fedeltà",
        short_name: "CardApp",
        description: "Gestione carte fedeltà con scansione barcode e condivisione",
        theme_color: "#111827",
        background_color: "#111827",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // Le carte vengono cachate via IndexedDB dall'app stessa (vedi src/lib/store.ts);
        // qui cachiamo solo l'app shell per consentire l'avvio offline.
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});
