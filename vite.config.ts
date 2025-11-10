import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["spider-192.png", "spider-512.png"],  
      manifest: {
        name: "SpiderCalisténico",
        short_name: "SpiderFit",
        start_url: "/SpiderCalistenic/",
        scope: "/SpiderCalistenic/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#ef4444",
        icons: [
          {
            src: "/spider-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/spider-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ],
  base: "/SpiderCalistenic/"
});
