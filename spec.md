# Mobile Kabadi Wala

## Current State
- Full-stack web app with Motoko backend and React frontend
- Seller form with mobile details, address, and optional photo upload
- Admin panel with password protection (Afifa@7862)
- No PWA support -- no manifest, no service worker, no mobile meta tags

## Requested Changes (Diff)

### Add
- `public/manifest.json` -- Web App Manifest with app name, icons, theme color, display mode
- `public/sw.js` -- Service Worker for basic offline support and caching
- `public/icons/` -- App icons in multiple sizes (192x192, 512x512)
- PWA meta tags in `index.html` (theme-color, apple-touch-icon, mobile-web-app-capable, etc.)
- Link to manifest in `index.html`
- Service worker registration script in `main.tsx` or `index.html`

### Modify
- `index.html` -- Add PWA meta tags, manifest link, title "Mobile Kabadi Wala"
- `vite.config.js` -- No changes needed (vite-plugin-pwa not required for basic PWA)

### Remove
- Nothing

## Implementation Plan
1. Generate app icon image (mobile/recycling theme)
2. Create `src/frontend/public/manifest.json` with name, short_name, icons, theme_color, background_color, display: standalone
3. Create `src/frontend/public/sw.js` with basic cache-first strategy for static assets
4. Update `index.html` with full PWA meta tags and manifest link
5. Add service worker registration in `main.tsx`
6. Validate and deploy
