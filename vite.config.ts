import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.NODE_ENV === "production" ? "./" : "/",
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
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "ui-vendor": [
            "lucide-react",
            "@radix-ui/react-dialog",
            "@radix-ui/react-tabs",
          ],
        },
      },
    },
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
          process.env.VITE_STRIPE_BACKEND_URL ||
          "https://vortexpcs-blu4m4bq5-vortexpc5.vercel.app",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/stripe/, "/api/stripe"),
      },
    },
  },
});
