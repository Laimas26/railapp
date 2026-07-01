# Deploying railapp (free HTTPS, installable on iPhone)

The app needs **HTTPS** for the offline service worker to work on iOS and for a
real "Add to Home Screen" PWA. A LAN address (`http://192.168.x.x`) is NOT
enough — it must be served over HTTPS. Any free static host works; this project
is set up for **Cloudflare Pages**.

## Cloudflare Pages (recommended — permanent URL, repeatable)

One-time setup (run in this folder; these open a browser to log in / sign up):

```sh
npx wrangler@3 login
npx wrangler@3 pages project create railapp --production-branch main
```

(Pinned to wrangler **v3** because v4 requires Node 22; this machine runs Node 21.)

Then deploy (re-run this any time to publish an update):

```sh
npm run deploy
```

`npm run deploy` runs `npm run build` and uploads `dist/`. The live URL will be
`https://railapp.pages.dev` (printed at the end of the command).

### Install on iPhone
1. On the iPhone open **Safari** and go to the `https://railapp.pages.dev` URL
   **once while online** (so the service worker can cache the app).
2. Tap **Share → Add to Home Screen**.
3. Launch it from the home-screen icon. It now works fully offline.

## Instant no-CLI alternative — Netlify Drop
For a quick throwaway link without any CLI/account:
1. Run `npm run build`.
2. Open https://app.netlify.com/drop in a browser.
3. Drag the `dist/` folder onto the page → you get an HTTPS URL immediately.
(Re-deploys are manual drag-and-drop; the URL is random unless you make an account.)

## Notes
- Routing uses a hash router (`/#/...`), so no SPA redirect config is needed.
- Updating the app: after Cloudflare deploy, the PWA auto-updates on next launch
  (registerType `autoUpdate`).
