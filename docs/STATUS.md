# Project status & next steps — railapp

_Last updated: 2026-06-30 (end of session)._

## Where it's at
- **Live:** https://railapp.pages.dev (Cloudflare Pages). Installable on iPhone:
  open in Safari while online → Share → Add to Home Screen. Works offline.
- **Stack:** Vite 5 + React 18 + TS, Dexie (IndexedDB), react-router-dom (hash),
  zustand, react-zoom-pan-pinch, react-hook-form, vite-plugin-pwa. Local-only.
- **Catalog:** real LTG regulation — all of §4 (iešmai) + §5.1.1 / §5.1.4 (bėgių
  grandinės; 5.1.4 = shunt/užimtumas). Two element types: switches + track circuits.
- **Station data (Rimkai):** all 33 real switches (1K…45) with SP-6M drives;
  18 track circuits (partial). `trackClass` main/other per switch is still a GUESS.

## PHOTO-TRACING schematic — DONE & DEPLOYED ✓
Switched from the drawn ladder to overlaying tappable hotspots on the REAL plan
photo (`src/assets/schematics/rimkai-plan.jpg`). Built, tested (43 pass), and
deployed to https://railapp.pages.dev.
- `PhotoSchematic` component, `elementPositions` Dexie table (v2, user data,
  survives reseeds), `services/db/queries/positions.ts`, **edit mode** in
  `SchematicView` (pick element → tap its real spot on the plan → position saved;
  "Pašalinti vietą" to clear). Hotspots: round = switch, square = track circuit.
- Hotspots start UNPLACED — first job next session is to place them (step 1 below).
- Old `SchematicCanvas.tsx` + `rimkai.svg` left in repo, unused (tree-shaken out).

## Next steps (pick up here)
1. **Place hotspots** — in the app, open a task → "Redaguoti vietas" → tap each
   switch/circuit's real spot on the plan. (User does this; they know the layout.)
2. **Confirm main vs other** — user gives the list of which of the 33 switches are
   on pagrindiniai / nestabdomojo pravažiavimo keliai → fix `trackClass` in
   `src/services/db/seed.ts` (bump `SEED_VERSION`).
3. **Better background** (optional) — a flat overhead scan of the plan would fix
   the curled east (Klaipėda) end; swap `rimkai-plan.jpg`.
4. **Official PDF/CAD** (SIII-S008-00-DP-GRS-RIM-BR-01) → perfect vector diagram.
5. Map switch↔machine numbers (M…) and per-track-circuit relay(+)/feed(●) ends.
6. Complete the track-circuit list (only ~18 of 34 mapped) from more close-ups.

## How to publish updates
`npm run deploy` (builds + pushes to Cloudflare Pages). One-time auth already done.

## Source photos (for digitizing)
`C:\Darbai\Freelance darbai\Winero notes\screenshots for claude\for claude 2..5.jpg`
(west→east). `for claude.jpg` = app screenshot, not the plan. High-res originals:
`C:\Users\laimo\Downloads\IMG_7642.jpg` (east half) and `IMG_7645.jpg` (panorama).
