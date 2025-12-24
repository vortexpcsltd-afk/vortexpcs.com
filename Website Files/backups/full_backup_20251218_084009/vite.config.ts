import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteCompression from "vite-plugin-compression";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      tailwindcss(),
      viteCompression({
        algorithm: "brotliCompress",
        ext: ".br",
        threshold: 1024,
        deleteOriginFile: false,
      }),
      viteCompression({
        algorithm: "gzip",
        ext: ".gz",
        threshold: 1024,
        deleteOriginFile: false,
      }),
    ],
    base: "/",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@/components": path.resolve(__dirname, "./components"),
        "@/styles": path.resolve(__dirname, "./styles"),
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      minify: "esbuild",
      cssMinify: true,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        onwarn(warning, defaultHandler) {
          const msg =
            typeof warning.message === "string" ? warning.message : "";
          if (
            msg.includes("dynamically imported") &&
            msg.includes("but also statically imported")
          )
            return;
          defaultHandler(warning);
        },
        output: {
          manualChunks: {
            // React core - loaded on every page
            "react-vendor": ["react", "react-dom", "react-router-dom"],

            // Firebase - only needed for auth/database features
            "firebase-vendor": [
              "firebase/app",
              "firebase/auth",
              "firebase/firestore",
              "firebase/storage",
            ],

            // Stripe - only needed for checkout
            "stripe-vendor": ["@stripe/stripe-js", "axios"],

            // UI components - shared across most pages
            "ui-vendor": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-tabs",
              "@radix-ui/react-select",
              "@radix-ui/react-tooltip",
              "@radix-ui/react-accordion",
              "@radix-ui/react-checkbox",
              "@radix-ui/react-label",
              "@radix-ui/react-slider",
              "@radix-ui/react-switch",
              "sonner",
            ],

            // Contentful - CMS integration
            "contentful-vendor": [
              "contentful",
              "@contentful/rich-text-react-renderer",
              "@contentful/rich-text-types",
            ],

            // Three.js ecosystem - heavy 3D library, only for AR viewer
            "three-vendor": [
              "three",
              "@react-three/fiber",
              "@react-three/drei",
            ],

            // PDF generation - only for build exports
            "pdf-vendor": ["jspdf", "html2canvas"],

            // Charts - only for analytics
            "chart-vendor": ["recharts"],

            // Utilities
            "utils-vendor": ["dompurify", "date-fns", "clsx", "tailwind-merge"],
          },
        },
      },
    },
    optimizeDeps: {
      exclude: [
        "firebase/analytics",
        "firebase/functions",
        "firebase/performance",
        "firebase/remote-config",
        "firebase/messaging",
      ],
    },
    server: {
      port: 3000,
      host: true,
      strictPort: false,
      hmr: { protocol: "ws", host: "localhost" },
      proxy: process.env.VERCEL
        ? undefined
        : {
            "/api/ai": {
              // AI endpoint always uses production Vercel
              target: "https://vortexpcs.com",
              changeOrigin: true,
              secure: true,
              rewrite: (p) => p,
            },
            "/api": {
              target: env.VITE_STRIPE_BACKEND_URL || "https://vortexpcs.com",
              changeOrigin: true,
              secure: true,
              rewrite: (p) => p,
            },
          },
    },
  };
});
