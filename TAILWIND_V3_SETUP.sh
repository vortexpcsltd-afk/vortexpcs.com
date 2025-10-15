#!/bin/bash
# VortexPCs - Switch to Tailwind v3 (Stable)
# Run this if Tailwind v4 continues to cause issues

echo "🔄 Switching to Tailwind CSS v3 (Stable)..."

# Remove Tailwind v4
echo "📦 Removing Tailwind v4..."
npm uninstall tailwindcss @tailwindcss/vite

# Install Tailwind v3 with dependencies
echo "📦 Installing Tailwind v3..."
npm install -D tailwindcss@3.4.17 postcss@8.4.49 autoprefixer@10.4.20

# Initialize Tailwind config
echo "⚙️ Creating Tailwind config..."
npx tailwindcss init -p

# Create proper tailwind.config.js
echo "📝 Creating tailwind.config.js..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
EOF

# Update vite.config.ts to remove Tailwind plugin
echo "📝 Updating vite.config.ts..."
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/components',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-components': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
          ],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
});
EOF

# Update globals.css first line
echo "📝 Updating styles/globals.css..."
# This is tricky in bash, so we'll create a note instead
cat > MANUAL_GLOBALS_CSS_UPDATE.txt << 'EOF'
MANUAL STEP REQUIRED:

Edit: styles/globals.css

Change the FIRST line from:
  @import "tailwindcss";

To:
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

(Replace 1 line with 3 lines)

Then save the file.
EOF

echo ""
echo "✅ Tailwind v3 installation complete!"
echo ""
echo "⚠️ MANUAL STEP REQUIRED:"
echo "Edit styles/globals.css and change the first line from:"
echo '  @import "tailwindcss";'
echo ""
echo "To these 3 lines:"
echo '  @tailwind base;'
echo '  @tailwind components;'
echo '  @tailwind utilities;'
echo ""
echo "Then run:"
echo "  git add ."
echo '  git commit -m "Switch to Tailwind v3"'
echo "  git push origin master"
echo ""
echo "🚀 Your site will deploy with stable Tailwind v3!"
