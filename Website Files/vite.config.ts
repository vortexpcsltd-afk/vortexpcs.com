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
      chunkSizeWarningLimit: 1500,
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
          manualChunks(id) {
            // Node modules chunking strategy
            if (id.includes("node_modules")) {
              // React core - loaded on every page
              if (
                /react[/\\](index|react|dom)/.test(id) ||
                id.includes("react-router-dom") ||
                id.includes("recharts") ||
                id.includes("contentful")
              ) {
                return "react-vendor";
              }

              // Firebase - only needed for auth/database features
              if (id.includes("firebase")) {
                return "firebase-vendor";
              }

              // Stripe & payment - only for checkout
              if (id.includes("@stripe") || id.includes("stripe-js")) {
                return "stripe-vendor";
              }

              // UI components - shared across most pages
              if (
                id.includes("@radix-ui") ||
                id.includes("sonner") ||
                id.includes("next-themes")
              ) {
                return "ui-vendor";
              }

              // Three.js ecosystem - heavy 3D library, only for 3D visualizer
              if (
                id.includes("three") ||
                id.includes("@react-three") ||
                id.includes("cannon-es")
              ) {
                return "three-vendor";
              }

              // PDF generation - only for build exports
              if (id.includes("jspdf") || id.includes("html2canvas")) {
                return "pdf-vendor";
              }

              // Utilities - common helpers
              if (
                id.includes("dompurify") ||
                id.includes("date-fns") ||
                id.includes("clsx") ||
                id.includes("tailwind-merge")
              ) {
                return "utils-vendor";
              }

              // Animation libraries
              if (id.includes("framer-motion")) {
                return "animation-vendor";
              }
            }

            // Source code chunking - split large feature areas
            if (
              id.includes("components/PCBuilder") ||
              id.includes("components/AdminPanel")
            ) {
              return "builder";
            }

            if (
              id.includes("components/Interactive3DBuilder") ||
              id.includes("components/Mobile3DVisualizerModal")
            ) {
              return "visualizer";
            }

            if (
              id.includes("components/BlogList") ||
              id.includes("components/BlogPost")
            ) {
              return "blog";
            }

            if (id.includes("services")) {
              return "services";
            }

            if (id.includes("hooks")) {
              return "hooks";
            }
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
