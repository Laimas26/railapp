# Manual iPhone Test Checklist — LTG Tikrinimai PWA

Target device: iPhone (Safari). Steps ordered as a real first-use flow.

---

## 1. First Online Load

- [ ] Open Safari and navigate to the hosted URL.
- [ ] App renders without a blank screen or console errors.
- [ ] Station schematic SVG loads and is pinchable/pannable.
- [ ] Inspection point picker shows grouped codes (e.g. 4.1.2a / 4.1.2b).
- [ ] In Safari address bar, tap the Share button — confirm "Add to Home Screen" option is present (proves the PWA manifest loaded).

---

## 2. Add to Home Screen

- [ ] Tap Share → Add to Home Screen → accept the default name → tap Add.
- [ ] The LTG Tikrinimai icon appears on the home screen (correct icon, not a generic bookmark).
- [ ] Tap the home-screen icon — app opens in standalone mode (no Safari navigation bar, status bar blends with `#0f172a`).
- [ ] Close the standalone app (swipe up).

---

## 3. Airplane-Mode Relaunch (Offline / Service Worker)

- [ ] Enable Airplane Mode on the device.
- [ ] Launch the app from the Home Screen icon.
- [ ] App loads fully from the service-worker cache — no "no internet" screen.
- [ ] The schematic SVG, CSS, and JS all appear (all assets were pre-cached).

---

## 4. Pick Inspection Point 4.1.2a — Main Switches Only

- [ ] In the offline app, open the inspection point picker.
- [ ] Select 4.1.2a.
- [ ] Confirm only **main-track switches** are highlighted yellow (point 4.1.2a uses `trackClassFilter: 'main'` and `elementTypes: ['switch']`).
- [ ] Confirm other-track switches (4.1.2b elements) are **not** highlighted.
- [ ] Progress counter shows "0 / N" where N equals the number of main switches.

---

## 5. Tap a Highlighted Switch → Inspect It

- [ ] Tap a yellow-highlighted switch on the schematic.
- [ ] A detail/inspection panel slides in or overlays (showing the switch label and measurement fields if any).
- [ ] Select **Pass** as the result.
- [ ] Fill in any measurement field shown (e.g. motor current in A).
- [ ] Submit / Save the result.
- [ ] The element turns **green** on the schematic.
- [ ] The progress counter increments to "1 / N".

---

## 6. Progress Updates Continuously

- [ ] Inspect two more switches (repeat step 5 twice).
- [ ] Counter updates correctly after each one (2 / N, then 3 / N).
- [ ] Previously-inspected (green) elements remain green when scrolling/panning away and back.

---

## 7. Complete the Session

- [ ] Inspect all remaining highlighted switches until counter reads "N / N".
- [ ] Confirm a "Complete session" button or auto-complete prompt appears.
- [ ] Tap it — session status changes to *completed*.
- [ ] The session disappears from the active/in-progress view (or is visually marked done).

---

## 8. Resume an In-Progress Session

- [ ] Start a new session for 4.1.2b (other-track switches).
- [ ] Inspect one or two elements, then navigate away (tap Back / Home).
- [ ] Return to the session list — the partial session is listed as **in progress**.
- [ ] Tap it to resume.
- [ ] Previously inspected elements are already green; counter reflects the saved progress.
- [ ] Inspect the remaining elements and complete the session.

---

## 9. History and Copy-to-Clipboard

- [ ] Open the History view.
- [ ] Both completed sessions appear (4.1.2a and 4.1.2b), each showing date, point code, and done/total.
- [ ] Tap a session to see individual element results and measurements.
- [ ] Tap the **Copy to Clipboard** button.
- [ ] Open Notes or Messages and paste — confirm formatted session data is present (not garbled, not empty).

---

## 10. Data Persists Across Force-Quit

- [ ] Force-quit the app: double-press Home (or swipe up and flick the app card away on Face ID devices).
- [ ] Keep Airplane Mode **on**.
- [ ] Relaunch from the Home Screen icon.
- [ ] All completed sessions still appear in History.
- [ ] In-progress sessions (if any) retain their partial results.
- [ ] The schematic for the last-viewed station loads from cache without any spinner freeze.

---

## Notes for the Tester

- IndexedDB data (Dexie) survives force-quit on iOS Safari — if data is lost, suspect a storage-quota eviction or a code bug calling `db.delete()` on start.
- If the app shows the "Add to Home Screen" option but the icon is blank, check that `public/icons/icon-192.png` and `icon-512.png` exist and the manifest paths are correct.
- If offline launch fails, open Safari DevTools (Mac → Develop → [device]) and check Application → Service Workers to confirm the SW is active.
- The `localeDateKey` formatter always uses local time — if a session date appears one day off, the device timezone may be relevant (not a bug in the app, but worth noting in the field).
