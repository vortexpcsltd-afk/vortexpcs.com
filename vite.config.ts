import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
<<<<<<< HEAD
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './components'),
      '@/styles': path.resolve(__dirname, './styles'),
=======

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/components',
>>>>>>> 037d06695c2ff190d50078afab895a9c0d22b581
    },
  },
  build: {
    outDir: 'dist',
<<<<<<< HEAD
    assetsDir: 'assets',
=======
>>>>>>> 037d06695c2ff190d50078afab895a9c0d22b581
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
<<<<<<< HEAD
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-tabs'],
=======
          'ui-components': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
          ],
>>>>>>> 037d06695c2ff190d50078afab895a9c0d22b581
        },
      },
    },
  },
<<<<<<< HEAD
  server: {
    port: 3000,
    host: true,
=======
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
>>>>>>> 037d06695c2ff190d50078afab895a9c0d22b581
  },
});
