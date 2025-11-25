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
      // Brotli compression for better compression ratios
      viteCompression({
        algorithm: "brotliCompress",
        ext: ".br",
        threshold: 1024,
        deleteOriginFile: false,
      }),
      // Gzip compression as fallback
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
      minify: "terser",
      cssMinify: true,
      cssCodeSplit: true,
      // Raise limit to reduce noisy large-chunk warnings (we also split vendors below)
      chunkSizeWarningLimit: 1200,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info", "console.debug"],
          passes: 2,
        },
        mangle: {
          safari10: true,
        },
      },
      rollupOptions: {
        // Quiet specific Rollup warnings about modules that are both dynamically and
        // statically imported — these do not affect correctness but generate noise.
        onwarn(warning, defaultHandler) {
          const msg =
            typeof warning.message === "string" ? warning.message : "";
          if (
            msg.includes("dynamically imported") &&
            msg.includes("but also statically imported")
          ) {
            return;
          }
          defaultHandler(warning);
        },
        output: {
          // Simplified chunking to mitigate ReferenceError in vendor bundle.
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return "vendor"; // single stable vendor chunk
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
      hmr: {
        protocol: "ws",
        host: "localhost",
      },
      // Proxy ALL API requests during development to Vercel deployment
      proxy: {
        "/api": {
          target: env.VITE_STRIPE_BACKEND_URL || "https://vortexpcs.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path, // Keep the full /api path
        },
      },
    },
  };
});
