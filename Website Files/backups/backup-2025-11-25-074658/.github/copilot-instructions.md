# Vortex PCs - AI Coding Instructions

## Project Overview

A React TypeScript e-commerce website for custom PC builds using Vite, shadcn/ui, Tailwind CSS, with optional Firebase/Stripe/Strapi integrations. Features premium glassmorphism design with dark theme and cyan/blue gradients.

## Architecture Patterns

### Component Structure

- **Root**: `App.tsx` handles routing, auth state, and modal management
- **Pages**: Large components like `PCFinder`, `PCBuilder`, `HomePage` in `/components`
- **UI**: shadcn/ui components in `/components/ui` with consistent styling
- **Services**: Backend integrations in `/services` (auth, database, payment, cms)
- **Config**: External service configs in `/config` (firebase, stripe, strapi)

### State Management

- React useState for local component state
- `AuthContext` provides global authentication state
- No external state management library - keep it simple
- localStorage for cart items and cookie preferences

## Styling & Design System

### Theme

- **Primary colors**: `sky-500`, `blue-500/600`, `cyan-500`
- **Background**: Pure black with animated gradient overlays
- **Cards**: Glassmorphism using `bg-white/5 backdrop-blur-xl border-white/10`
- **Text**: White primary, `gray-300` secondary, color-coded accents

### Component Conventions

```tsx
// Standard card with glassmorphism
<Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300">

// Primary button with gradient
<Button className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500">

// Badge with theme colors
<Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400">
```

## Development Workflow

### Build & Dev Commands

```bash
npm run dev        # Start dev server on :3000
npm run build      # Production build
npm run preview    # Test production build
npm run lint       # ESLint check
```

### File Organization

- Components: `/components/ComponentName.tsx` (PascalCase)
- Services: `/services/serviceName.ts` (camelCase)
- Types: Define interfaces inline or in service files
- Assets: Use external URLs or public directory

## External Integrations (Optional)

### Firebase Setup

- Authentication disabled by default (`config/firebase.ts` exports undefined)
- Enable by setting `VITE_FIREBASE_*` environment variables
- Services handle graceful fallbacks when Firebase unavailable

### Backend Integration Flow

1. **Development**: Mock auth in `App.tsx`, placeholder data in components
2. **Production**: Set environment variables, deploy backend examples from `/backend-examples`
3. **Services**: Import functions from `/services` - they handle initialization checks

### Environment Variables

```env
# Firebase (optional)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=

# Stripe (optional)
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_STRIPE_BACKEND_URL=

# Strapi CMS (optional)
VITE_STRAPI_URL=
VITE_STRAPI_API_TOKEN=
```

## Key Integration Points

### Authentication Flow

- `AuthContext` → `services/auth.ts` → `config/firebase.ts`
- Mock login functions in `App.tsx` for development
- Real auth requires Firebase environment variables

### Payment Processing

- Cart state in `App.tsx` → `ShoppingCartModal` → `services/payment.ts`
- Stripe integration requires backend API (see `/backend-examples`)

### Content Management

- Product data via `services/cms.ts` → `config/strapi.ts`
- Fallback to hardcoded data when Strapi unavailable

## Common Patterns

### Error Handling

```tsx
try {
  // Firebase/Stripe operation
} catch (error) {
  console.error("Operation error:", error);
  throw new Error(error.message || "Operation failed");
}
```

### Responsive Design

- Mobile-first approach with `md:` breakpoints
- Glassmorphism works across all screen sizes
- Use `container mx-auto px-4` for page layouts

### Animation & Effects

- CSS animations defined in `globals.css` (gradient, float, glow, shimmer)
- Consistent hover states with `transition-all duration-300`
- Use Lucide React icons consistently

## Critical Files

- `App.tsx` - Main app logic and routing
- `vite.config.ts` - Build configuration and aliases
- `styles/globals.css` - Theme variables and animations
- `BACKEND_INTEGRATION_GUIDE.md` - Complete setup instructions
- `COMMANDS.md` - Deployment and debugging commands

## Development Notes

- Optional integrations mean app works without external services
- Prioritize user experience over feature completeness during development
- Use TypeScript interfaces for better IDE support
- Cache busting via `public/version.json` for deployment issues
