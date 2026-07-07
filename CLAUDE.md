# CLAUDE.md — LTG Railway Inspection PWA (Rimkai)

## 1. What This Is

**LTG Tikrinimai** is an offline-first PWA for an LTG (Lithuanian Railways) electromechanic to track scheduled inspections at Rimkų g. st. (Rimkai station). The MVP is feature-complete and ready for field testing.

**Typical workflow:**
1. Pick an inspection task (e.g., 4.1.2a — main track switches)
2. Matching switches highlight **yellow** on an SVG schematic
3. Tap a switch → detail panel opens
4. Mark result (Pass/Fail) + any measurements (current, voltage, etc.)
5. Switch turns **green** (or red if failed)
6. Progress counter increments
7. Complete session when all switches inspected

**Storage:** All data is local (IndexedDB via Dexie), no backend. Session history is persisted and can be copied to clipboard as text for manual backup. UI is in Lithuanian. **PWA installable on iPhone** via Safari "Add to Home Screen"; designed to stay Capacitor-wrappable for a future native/TestFlight build.

---

## 2. Commands

```bash
npm run dev              # Start dev server (usually http://localhost:5173)
npm run build           # Compile TS + bundle (tsc -b && vite build)
npm run preview --host  # Preview build on desktop + LAN (e.g., test on phone)
npm run typecheck       # Check TS without emitting (tsc -b --noEmit)
npm test                # Run Vitest once
npm run test:watch      # Vitest watch mode
```

**Notes:**
- `npm run preview --host` already has `--host` set in vite.config.ts (line 39), so you can skip typing it.
- Node 21 may print harmless `EBADENGINE` warnings; ignore them.
- First production-like build for iOS should be `npm run build` → serve the `dist/` folder over HTTPS on a phone-accessible URL (e.g., LAN), then open in Safari to install.

---

## 3. Architecture & Layout

### Folder Structure

```
src/
├── types/               # Shared domain types (Station, Element, InspectionPoint, etc.)
├── services/db/
│   ├── schema.ts       # Dexie RailDB singleton + database definition
│   ├── seed.ts         # Rimkai data: station, switches, inspection points
│   └── queries/
│       ├── catalog.ts  # Station, inspection point lookups
│       ├── elements.ts # Schematic element queries
│       ├── sessions.ts # Session CRUD, create-or-resume atomicity
│       └── results.ts  # Inspection result queries
├── store/              # Zustand UI state (currently just selectedSvgElementId)
├── hooks/              # React hooks (useActiveSession, useHighlightedElements, etc.)
├── utils/              # Pure logic (date formatting, element matching)
├── components/
│   ├── ui/             # Reusable UI primitives (Button, Badge, Modal, ProgressBar)
│   ├── layout/         # Layout components (Header, Layout)
│   ├── schematic/      # SchematicCanvas (SVG rendering + hit detection)
│   └── inspection/     # Task-specific (MeasurementForm, ResultActions, ElementDetailModal)
├── views/              # Page views (HomeView, SchematicView, HistoryView, SessionDetailView)
├── router.tsx          # React Router config (hash-based for PWA)
├── App.tsx             # Root component
├── main.tsx            # Bootstrap: seed DB, mount React
└── index.css           # Global styles + SVG element state colors
```

### Storage Boundary Rule (Critical)

**Components and hooks must NEVER import Dexie directly.** Instead:

- Call **query functions** from `src/services/db/queries/*` (async callbacks)
- Use `useLiveQuery(() => queryFunction(db, ...))` from `dexie-react-hooks` for reactive updates
- This keeps the app's data layer encapsulated and **Capacitor-portable**.

Example: `src/views/HomeView.tsx` line 32–34:
```typescript
const station = useLiveQuery(() => getDefaultStation(db), [])
const points = useLiveQuery(() => getInspectionPoints(db), [])
```

---

## 4. Key Conventions & How to Extend

### Dexie Schema Migrations

**Rule (also in `src/services/db/schema.ts` line 13–16):** NEVER edit an existing `.version()` block. To change table structure, add a NEW `.version(N).stores(...).upgrade(...)` block with the next integer.

Only indexed fields are listed in `.stores()`; other fields are stored implicitly. Composite indexes use `[a+b]` (e.g., `[stationId+date]`) and multi-valued indexes use `*tags`.

Example: if you want to add a `timestamp` field and a new index, create `version(2)` with the updated `.stores()` spec and an optional `.upgrade()` callback to backfill old docs.

---

### Adding Inspection Points

**No code changes needed.** Insert rows directly in `src/services/db/seed.ts` `inspectionPoints` array. Key fields:

- **`id`** (required): display code, e.g., "4.1.2a"
- **`baseCode`** (required): groups variants in picker, e.g., "4.1.2"
- **`variant`** (required): "a" | "b" | null (null if not a variant)
- **`description`** (required): full Lithuanian text
- **`elementTypes`** (required): array like `['switch']` (e.g., `['switch', 'signal']`)
- **`trackClassFilter`** (required): `'main'`, `'other'`, or `'all'`
  - Controls which switches show for this task (main vs. other track)
  - Matches against `schematicElement.trackClass`
- **`requiredTags`** (required): array of tags; empty = no tag filter
  - Each tag here must be present in `schematicElement.tags`
- **`requiresMeasurements`** (required): boolean; if true, shows measurement form
- **`measurementDefs`** (required if `requiresMeasurements: true`): array of fields
  - Each def has `key`, `label`, `unit`, `dataType` ('number' | 'boolean'), `min`, `max`, `required`

The **element matching rule** lives in `src/utils/match.ts` (`matchesPoint`):
```typescript
function matchesPoint(el: SchematicElement, point: InspectionPoint): boolean {
  if (!point.elementTypes.includes(el.elementType)) return false
  if (point.trackClassFilter !== 'all' && el.trackClass !== point.trackClassFilter)
    return false
  return point.requiredTags.every((tag) => el.tags.includes(tag))
}
```

---

### Adding / Replacing a Station Schematic

1. **Author an SVG** where each clickable element (switch, signal, etc.) is structured as:
   ```xml
   <g data-element-id="sw-N" data-element-number="N">
     <circle class="node" cx="..." cy="..." r="12" />
     <rect class="hit" x="..." y="..." width="48" height="48" class="hit" />
     <text class="lbl" x="..." y="...">N</text>
   </g>
   ```
   - `data-element-id` must match the application element ID (e.g., "sw-1")
   - `circle.node` is the visual indicator; state classes toggle its fill color
   - `rect.hit` is a transparent ≥48px tap target (iOS touch zones)
   - `text.lbl` is the label (number or name)

2. **Drop the SVG** in `src/assets/schematics/` (e.g., `mystation.svg`)

3. **Register in SchematicCanvas** (`src/components/schematic/SchematicCanvas.tsx` line 7–9):
   ```typescript
   const SCHEMATICS: Record<string, string> = {
     rimkai: rimkaiSvg,
     mystation: myStationSvg,  // add this
   }
   import myStationSvg from '../../assets/schematics/mystation.svg?raw'  // add this
   ```

4. **Update the station's `schematicFile`** in seed.ts (e.g., set `schematicFile: 'mystation'`)

5. **Add matching `schematicElements` rows** in seed.ts so that each element's `svgElementId` matches the group's `data-element-id`. Example for a new station:
   ```typescript
   const elements: SchematicElement[] = [
     {
       id: 'sw-1',
       stationId: 'mystation',
       elementNumber: '1',
       elementType: 'switch',
       trackClass: 'main',
       svgElementId: 'sw-1',  // must match SVG group's data-element-id
       label: 'Iešmas Nr. 1',
       machine: 'M1',
       tags: [],
     },
     // ...
   ]
   ```

---

### Element State Colors (src/index.css, lines 90–109)

SchematicCanvas toggles these CSS classes on element groups; defined as:

- **`el-highlighted`** → yellow (`--yellow: #f5c542`) — element needs inspection in the current task
- **`el-inspected`** → green (`--green: #4caf50`) — element inspected and passed
- **`el-failed`** → red (`--red: #e53935`) — element inspected and failed
- **`el-active`** → blue stroke ring (`--blue: #3b82f6`) — element detail sheet is currently open

---

## 5. Current Data Caveats (IMPORTANT)

The Rimkai data in `src/services/db/seed.ts` uses **REAL switch numbers and machines** (M1–M33, read from plan SIII-S008-00-DP-GRS-RIM-BR-01, LTG Infra 2024-09).

**However:**
- **(a) Main-vs-other `trackClass` per switch — CONFIRMED 2026-07-07** (seed v4).
  Rule: a switch is `'main'` iff it sits on one of the **two bold through-lines**
  (pagrindiniai keliai IK/IIK) on the diagram; yard-ladder / siding / ramp switches
  are `'other'`. Main (19): `1K 2K 3K 4 5K 6K 7K 8K 10K 11K 12K 13K 14K 15K 19 20K
  23K 27K 35`; other (14): `9 16 17 18 21 22 24 25 26 29 37 39 43 45`. This controls
  which switches appear in every §4 a (main) vs b (other) task, e.g. 4.1.1a/b.
  - **Fix any single switch:** edit its row in the `SWITCHES` array in seed.ts and
    bump `SEED_VERSION`. Rerun app; reference data reseeds (idempotent).

- **(b) SVG geometry is simplified**, not the true track layout. The schematic at `src/assets/schematics/rimkai.svg` is a working diagram, not a scale reproduction.
  - **Fix:** Once the user confirms the geometry, drop an accurate SVG in place and update `schematicElements` to match the new `svgElementId` values.

Both are **data-only swaps** with no code changes.

---

## 6. iOS Install & Offline Notes

### First Load (Must be Online)

1. Navigate to the PWA URL (e.g., `https://example.com/railapp/`) in Safari on iPhone
2. Service worker caches all assets (JS, CSS, SVG, PNG icons, fonts)
3. First load populates IndexedDB with seed data (station, switches, inspection points)

### Add to Home Screen

1. In Safari address bar, tap **Share** → **Add to Home Screen**
2. Icon (from `public/icons/icon-192.png` or `icon-512.png`) appears on home screen
3. Launch from home-screen icon → standalone mode (no Safari nav bar)

### Subsequent Loads (Offline OK)

- Service worker serves cached assets; app works fully offline
- IndexedDB persists session/result data across force-quit
- **⚠️ iOS may evict IndexedDB if app is not used for ~2 weeks** (iOS storage quota)
  - Mitigation: SessionDetailView has a "Kopijuoti" (Copy to Clipboard) button to export session data as text; marker positions can be backed up via "Kopijuoti vietas" (edit-mode footer) to move them between devices

See `docs/manual-test-checklist.md` for step-by-step field validation.

---

## 7. Testing

**Vitest** suite at `src/__tests__/`:

- **`match.test.ts`** — element-point matching rules (trackClassFilter, requiredTags)
- **`date.test.ts`** — date formatting and local date key generation
- **`positionsTransfer.test.ts`** — marker position export/import serialization and validation

Run with `npm test` or `npm run test:watch`.

Current coverage: utility functions (pure logic). Views and components are tested manually (see `docs/manual-test-checklist.md`).

---

## 8. Dependencies & Notes

- **React 18.3** — UI framework
- **React Router 6.28** — hash-based navigation (PWA-friendly)
- **Dexie 4.0 + dexie-react-hooks 1.1** — IndexedDB wrapper + React hooks
- **Zustand 5.0** — lightweight state management (UI state only, not data)
- **React Hook Form 7.54** — measurement/result form binding
- **react-zoom-pan-pinch 3.6** — schematic SVG pan/zoom (pinch on mobile)
- **Vite 5.4** — build tool
- **vite-plugin-pwa 0.21** — PWA manifest + service worker injection
- **Vitest 2.1** — test runner (Vite-native)
- **TypeScript 5.7** — type checking

---

## 9. Future Extensions (Notes for Roadmap)

- **Multiple stations:** Extend seed.ts and router to support station picker
- **Capacitor wrap:** Move to `capacitor-app-routing` and native storage if needed
- **Sync to backend:** Add a `/api/sessions` endpoint + conflict resolution for offline→online merging
- **Custom tags:** Allow users to tag elements for ad-hoc filtering (currently unused)
- **Camera integration:** Photo attachments to inspection results (future Capacitor feature)
- **Dark mode toggle:** Currently hard-coded dark; easy to add via `useUiStore`

---

## Diagram: Data Flow

```
HomeView (pick task)
    ↓
createOrResumeSession(db, { stationId, pointId, date })
    ↓
SchematicView (render & interact)
    ↓
useHighlightedElements(stationId, pointId) → query matching elements
    ↓
SchematicCanvas (yellow highlight, tap)
    ↓
ElementDetailModal (form: Pass/Fail + measurements)
    ↓
saveInspectionResult(db, result)
    ↓
useSessionProgress re-calculates; element turns green/red
    ↓
completeSession(db, sessionId) when all inspected
    ↓
HistoryView (session list) → SessionDetailView (detail + copy-to-clipboard)
```

---

## Quick Links

- **DB schema:** `src/services/db/schema.ts`
- **Seed data:** `src/services/db/seed.ts`
- **Queries:** `src/services/db/queries/*.ts`
- **Matching logic:** `src/utils/match.ts`
- **SVG element state:** `src/index.css` lines 90–109
- **Schematic rendering:** `src/components/schematic/SchematicCanvas.tsx`
- **Router:** `src/router.tsx`
- **Manual tests:** `docs/manual-test-checklist.md`
