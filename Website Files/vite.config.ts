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
      // Keep a higher threshold to avoid noisy warnings on purposefully large chunks
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        onwarn(warning: unknown, defaultHandler) {
          const code = (warning && (warning as { code?: string }).code) || "";
          const msg =
            typeof warning.message === "string" ? warning.message : "";
          // Ignore noisy Rollup warnings that are safe in our Vite setup
          if (
            // Next.js-style "use client" directives in deps/components
            code === "MODULE_LEVEL_DIRECTIVE" ||
            // Sourcemap resolution noise from dependencies during reporting
            code === "SOURCEMAP_ERROR" ||
            // Vite sometimes warns when a module is both static and dynamic imported
            (msg.includes("dynamically imported") &&
              msg.includes("but also statically imported"))
          ) {
            return;
          }
          defaultHandler(warning);
        },
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              // Split only heavy, independent libraries to avoid circular deps
              if (id.includes("three")) return "three";
              if (id.includes("firebase")) return "firebase";
              if (id.includes("@contentful")) return "contentful";
              // Let everything else (React, icons, etc.) bundle naturally
            }
          },
        },
      },
    },
    server: {
      proxy: {
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
