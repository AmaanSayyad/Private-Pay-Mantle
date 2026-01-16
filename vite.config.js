import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd());

  const serverConfig =
    env.VITE_ENABLE_LOCAL_DNS === "true"
      ? {
          host: "squidl.test",
          port: 5173,
          hmr: {
            host: "squidl.test",
            protocol: "ws",
          },
        }
      : {};
  return {
    plugins: [
      react(),
      svgr(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "assets/*.png", "assets/*.svg"],
        manifest: {
          name: "PrivatePay - Private Payments on Mantle",
          short_name: "PrivatePay",
          description: "Privacy-preserving payment platform on Mantle Network with stealth addresses",
          theme_color: "#0d08e3",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait-primary",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/assets/squidl-only.svg",
              sizes: "192x192",
              type: "image/svg+xml",
              purpose: "any maskable"
            },
            {
              src: "/assets/squidl-logo-only.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ],
          shortcuts: [
            {
              name: "Send Payment",
              short_name: "Send",
              description: "Send a private payment",
              url: "/send",
              icons: [{ src: "/assets/squidl-only.svg", sizes: "192x192" }]
            },
            {
              name: "Payment Links",
              short_name: "Links",
              description: "View your payment links",
              url: "/payment-links",
              icons: [{ src: "/assets/squidl-only.svg", sizes: "192x192" }]
            }
          ]
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
          // Exclude large chunks from precaching, they'll be cached on-demand
          globIgnores: [
            "**/node_modules/**/*",
            "**/dev-dist/**/*",
            "**/*.map"
          ],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-cache",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/.*\.mantle\.network\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "mantle-rpc-cache",
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 5 // 5 minutes
                }
              }
            },
            // Cache large JS chunks on-demand instead of precaching
            {
              urlPattern: /\.(?:js|css|woff|woff2)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "static-resources",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: "module"
        }
      })
    ],
    server: serverConfig,
    test: {
      environment: 'node',
      globals: true
    }
  };
});
