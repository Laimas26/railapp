# LTG Railway Inspection PWA — Rimkai

An offline-first progressive web app for LTG (Lithuanian Railways) electrochemanics to track scheduled inspections at Rimkų g. st. (Rimkai station).

## What It Does

- Pick an inspection task (e.g., "4.1.2a — main track switches")
- Matching switches highlight yellow on an interactive SVG schematic
- Tap a switch → mark it Pass/Fail + enter measurements
- All data stored locally (no backend required)
- Works offline after first load
- Installable on iPhone via Safari "Add to Home Screen"

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally (testable on iPhone over LAN)
npm run preview --host
```

## Test on iPhone

1. **First load (must be online)**
   - Navigate to PWA URL in Safari
   - Service worker caches all assets
   - Database seeds with Rimkai inspection data

2. **Add to Home Screen**
   - Safari: Share → Add to Home Screen
   - Icon appears on home screen; tap to launch in standalone mode

3. **Works offline**
   - All subsequent loads work without internet
   - Session data persists across force-quit (IndexedDB)
   - Copy session to clipboard as text backup if needed

## Key Files

- **`CLAUDE.md`** — complete project guide (architecture, conventions, how to extend)
- **`src/services/db/schema.ts`** — Dexie database definition (Rimkai inspection data)
- **`src/views/`** — main pages (HomeView: pick task; SchematicView: inspect; HistoryView: results)
- **`src/components/schematic/SchematicCanvas.tsx`** — interactive SVG rendering
- **`docs/manual-test-checklist.md`** — step-by-step field validation

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build (TypeScript + Vite bundling) |
| `npm run preview --host` | Preview build on desktop + LAN (iPhone-testable) |
| `npm test` | Run tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Type check without emitting |

## Architecture

- **Frontend:** React 18 + React Router (hash-based for PWA)
- **Data:** IndexedDB (Dexie) with service worker caching
- **State:** Zustand (UI only), components use `dexie-react-hooks` for data
- **Build:** Vite + vite-plugin-pwa (PWA manifest + service worker)
- **Language:** Lithuanian (UI), TypeScript (code)

## Notes

- **Node 21:** Harmless `EBADENGINE` warnings; ignore them.
- **iOS Safari:** First load must be online; subsequent loads work fully offline.
- **Storage boundary:** Components never import Dexie directly; they call query functions from `src/services/db/queries/`.

## Future: Capacitor Wrap

This project is designed to be wrappable with Capacitor for a native iOS app / TestFlight build. No framework-specific code blocks that path.

---

For detailed architecture and extension guide, see **[CLAUDE.md](./CLAUDE.md)**.
