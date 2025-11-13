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
      chunkSizeWarningLimit: 500,
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
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
            "ui-vendor": [
              "lucide-react",
              "@radix-ui/react-dialog",
              "@radix-ui/react-tabs",
            ],
            // Split large feature/vendor chunks to reduce initial JS
            "cms-vendor": ["contentful"],
            "stripe-vendor": ["@stripe/react-stripe-js", "@stripe/stripe-js"],
            // Further split Firebase to reduce single large vendor chunk
            "firebase-auth": ["firebase/auth"],
            "firebase-db": ["firebase/app", "firebase/firestore"],
            charts: ["recharts"],
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
      // Proxy stripe API requests during development to avoid CORS issues
      proxy: {
        // Forward any local /api/stripe requests to the configured backend
        "/api/stripe": {
          target:
            env.VITE_STRIPE_BACKEND_URL ||
            "https://vortexpcs-blu4m4bq5-vortexpc5.vercel.app",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/stripe/, "/api/stripe"),
        },
      },
    },
  };
});
