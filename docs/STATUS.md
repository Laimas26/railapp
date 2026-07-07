# Project status & pickup notes — railapp

_Last updated: 2026-07-01 (end of session)._

## Where it's at
- **Live:** https://railapp.pages.dev (Cloudflare Pages). iPhone install: open in
  Safari while online → Share → Add to Home Screen. Works offline. `npm run deploy`
  to publish (one-time auth already done). **Reload/reopen the app to get updates
  (PWA caches hard — fully close & reopen if a change isn't showing).**
- **Stack:** Vite 5 + React 18 + TS, Dexie (IndexedDB, local-only), react-router-dom
  (hash), zustand, react-zoom-pan-pinch, react-hook-form, vite-plugin-pwa. 43 Vitest tests.
- **Catalog:** real LTG regulation — all of §4 (iešmai) + §5.1.1 / §5.1.4 (bėgių
  grandinės; 5.1.4 = shunt/užimtumas). Two element types: switch, track-circuit.
- **Station data (Rimkai):** 33 real switches (1K…45), SP-6M drives; 18 track
  circuits (partial). `trackClass` main/other **CONFIRMED 2026-07-07** (seed v4):
  main = the 19 switches on the two bold through-lines (IK/IIK) —
  `1K 2K 3K 4 5K 6K 7K 8K 10K 11K 12K 13K 14K 15K 19 20K 23K 27K 35`; the other
  14 (`9 16 17 18 21 22 24 25 26 29 37 39 43 45`) are yard/siding/ramp. Drives the
  §4 a/b highlight split (4.1.1a = main).

## Schematic — CURRENT: the user's Paint sketch, recolored + stretched
The diagram background is the **user's own Paint sketch** (`screenshots for claude/
railapp schema.png`), recolored to the dark theme and **stretched 1.8× wide** for
room, embedded as a base64 image in `src/assets/schematics/rimkai.svg`. Rendered by
`DiagramBoard` in `SchematicView`.
- **Generator (ACTIVE):** `scripts/paint-to-svg.py` (recolors + stretches the PNG →
  rimkai.svg). Change `STRETCH` there to make it wider/narrower, re-run, redeploy.
- **Markers:** small proportional **SVG overlay** (circle = switch, square = track
  circuit, number label below), sized in the diagram's viewBox units so they scale
  with zoom. User positions them via **"Redaguoti vietas"** (pick element → tap to
  place, drag to move, "Pašalinti vietą" to clear). Stored in `elementPositions`
  Dexie table (v2). **Start EMPTY** — default seeding removed; existing installs'
  old positions are cleared once via `localStorage 'railapp.posReset'='2'`.
  Normal mode shows only the **current task's** elements (not all 51).

### Other diagram options (available, not active)
- `scripts/generate-schematic.py` — a clean, wide **vector** diagram with track
  labels (Vilkyčiai/Draugystė Y, mains, yard tracks, Pervaža, east sidings). The
  user tried it but preferred the stretched sketch for now. Run it to switch back.
- User may instead **redraw the layout in draw.io / Inkscape** and send an SVG →
  recolor (like paint-to-svg) and drop into `rimkai.svg`; markers work on any SVG.
  A copy for editing is at `C:\Users\laimo\Downloads\rimkai.svg`.
- Unused fallbacks in repo: `PhotoSchematic` (+ `rimkai-plan.jpg` photo background),
  `SchematicCanvas` (SVG with baked-in shapes).

## Next steps (pick up here)
1. **User places the markers** in the app (edit mode) — the diagram starts empty.
   (Mostly done — 32/33 placed as of 2026-07-07; user positions saved in the
   `elementPositions` table and are NOT cleared by reseeds.)
2. **Diagram look** — if the stretched sketch still isn't right, either bump
   `STRETCH` in `scripts/paint-to-svg.py`, switch to the vector
   (`generate-schematic.py`), or the user sends a draw.io/Inkscape SVG to plug in.
3. ~~**Confirm main vs other**~~ **DONE 2026-07-07** (seed v4) — see "Station data"
   above. If any single switch is still off, edit its row in the `SWITCHES` table
   in `src/services/db/seed.ts` and bump `SEED_VERSION`.
4. **Official PDF/CAD** (SIII-S008-00-DP-GRS-RIM-BR-01, or 2020 BELAM LG10 plan)
   → would enable a perfect vector diagram.
5. Map switch↔machine numbers (M…) + per-track-circuit relay(+)/feed(●) ends;
   complete the track-circuit list (only ~18 of ~34 mapped).

## Git
Lots of uncommitted changes are piling up (project isn't committed since "first
commit"). Offer the user a commit message next time. Note: `tsconfig.app.tsbuildinfo`
is tracked but shouldn't be — consider `.gitignore` + `git rm --cached`.

## Source material (for digitizing the real layout)
- **User's sketch (intended shape):** `Winero notes/screenshots for claude/railapp schema.png`
- **Clean 2020 plan photos:** `Downloads/railapp photos/IMG_7792..7797.jpg`
  (east→west = 7792→7797; 7793 shows the Pervaža; 7797 the Draugystė Y).
- **2024 plan:** `Downloads/IMG_7642.jpg`, `IMG_7645.jpg`; `screenshots for claude/for claude 2..5.jpg`.
- **Real track order (top→bottom):** 10K, 8K, 6K, 4K, IIK, IK, 3K + sidings.
- Preview any SVG without running the app: render with `sharp` (Node) in the
  scratchpad; inject sample `<circle>/<rect>` markers to check marker size.
