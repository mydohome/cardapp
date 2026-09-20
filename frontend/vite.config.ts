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
        // Precache dell'app shell (JS/CSS/HTML): permette all'app di avviarsi
        // completamente offline. I dati delle carte sono cachati separatamente
        // dall'app stessa in localStorage (vedi src/lib/cardCache.ts).
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        // Senza questo, solo la richiesta esatta a "/" viene servita offline
        // dalla cache (mappata automaticamente su index.html). L'app usa
        // react-router lato client: rotte come /scan, /card/:id, /login non
        // corrispondono a nessun file reale, quindi un caricamento diretto o
        // un refresh su una di queste offline (es. la PWA che riapre l'ultima
        // schermata) va in rete, fallisce e mostra una pagina bianca. Con
        // navigateFallback, ogni richiesta di navigazione non precachata
        // ricade comunque su index.html, che poi fa il routing client-side.
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Loghi negozio: possono provenire da domini esterni, quindi non
            // rientrano nel precache dell'app shell. CacheFirst li rende
            // disponibili offline dopo il primo caricamento andato a buon fine.
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "store-logos",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});
