# True Link PLC — Outlet Registration App

A mobile-friendly Next.js web app for scanning outlet stickers, registering
outlets, and looking up outlets that are already registered.

## Architecture: two parts, two hosts

This system is split across two hosts on purpose:

- **This app** (Next.js) runs on **Vercel** (free tier) — no build/resource
  limits to fight, Vercel handles that natively.
- **The actual data** (registrations + photos) lives on **your cPanel
  hosting**, via a small PHP + MySQL API (see the separate `cpanel-api`
  folder). Vercel's servers don't have persistent storage, so this app talks
  to that API over HTTPS instead of writing to local files.

You need to set up **both halves** for this to work. Set up `cpanel-api`
first (see its own README), then come back here for the Vercel side.

## Login

Every page requires signing in first, so every registration is tied to a
name. Current accounts (change these — see "Managing users" below):

| User | Username | Password | Role |
|---|---|---|---|
| Estephanos | `estephanos` | `kYCPvgi8hD` | **Super Admin** — dashboard + edit + CSV export |
| Redeat | `redeat` | `riwBnxcw9K` | Dashboard — can view + edit outlets |
| Abubeker | `abubeker` | `fbdNQSKhfF` | Dashboard — can view + edit outlets |
| User 4 | `user4` | `NK3xsPWAMb` | Staff — registration only, no dashboard |
| User 5 | `user5` | `bjiDWgRHnu` | Staff |
| User 6 | `user6` | `CZmvHARvE4` | Staff |
| User 7 | `user7` | `qTCbJWJsFq` | Staff |
| User 8 | `user8` | `STkBXSXUA2` | Staff |
| User 9 | `user9` | `YitaJvEbcN` | Staff |
| User 10 | `user10` | `aikTxmY4y4` | Staff |

Every outlet registration records which username created it, and the search
list / scan-to-view screens show "Registered by [name]".

**Keep this table somewhere safe (not posted publicly)** — treat it like any
other password list. Passwords are stored as bcrypt hashes in
`data/users.json`, never in plain text.

### Roles

- **`staff`** — can register outlets and view the registered list. No
  dashboard access.
- **`dashboard`** — everything staff can do, plus: **Dashboard** page to
  search/browse all outlets, edit any editable field, and view each
  outlet's change history (who changed what, and when).
- **`admin`** (super admin — currently just Estephanos) — everything
  `dashboard` can do, plus a **CSV export** of all outlet data.

Every edit is recorded — the dashboard's History view on each outlet shows
exactly which field changed, from what value to what value, who made the
change, and when. This is enforced both in the UI and on the server (so it
can't be bypassed by calling the API directly).

### Managing users

To change passwords, rename users, change roles, or add more:

1. Edit `scripts/generate-users.js` — update the `USERS` array (username,
   displayName, password, **role**: `"staff"`, `"dashboard"`, or `"admin"`).
2. Run:
   ```
   node scripts/generate-users.js
   ```
   This overwrites `data/users.json` with fresh bcrypt hashes.
3. **Commit this file and redeploy to Vercel** (see note below — Vercel
   deployments are a snapshot of your code, so changes only take effect on
   the next deploy, unlike the old cPanel setup where you could edit files
   directly on the server).

## What it does

- **Home page** — choose "Register Outlet" or "View Registered"
- **Register Outlet** — a 5-step wizard:
  1. Scan the QR sticker (either QR code works — see note below)
  2. Full Name*, Phone Number*, Phone Number 2 (optional), TIN Number
     (optional), Average Drop Size (optional), Visits Per Month (optional)
  3. Geolocation — auto-detects your position, then lets you drag the pin
     on the map to fine-tune the exact spot. Toggle between Street and
     Satellite view for extra accuracy when placing the pin.
  4. Outlet photo (optional) — take a photo or choose one from the gallery
  5. Review and submit
- **View Registered**
  - **Search List** — search all registered outlets by name, phone, or ID
  - **Scan to View** — scan a sticker's QR to instantly pull up that outlet's
    registration (or see that it isn't registered yet)
- **Dashboard** (dashboard/admin roles only) — search/browse all outlets,
  edit any field, view each outlet's edit history, and (super admin only)
  export everything as CSV

## Important: how the two QR codes relate

Your stickers (from `generate_stickers.py`) have two QR codes:

- **Left QR** — a public URL like `https://truelink.et/TL-0001` (contains the
  real outlet ID directly)
- **Right QR** — an opaque 6-character code like `778LM0` that is **not**
  derivable from the ID on its own — it only maps back via the
  `id_token_mapping.csv` file the sticker script generates

This app works with **either** QR, but to resolve the right-QR code back to
a real outlet ID, it needs that mapping file bundled into the deployment:

```
data/id_token_mapping.csv
```

**Important Vercel-specific detail:** unlike the old cPanel setup, you can't
just upload this file to a running server — it needs to be part of your
project's source code **before you deploy**, since Vercel deployments are
an immutable snapshot. Whenever you print a new batch of stickers, update
this file and redeploy.

If that file isn't present, scanning the left QR (URL) still works fine on
its own — only right-QR scans need the mapping file.

**Lost the mapping file?** As long as you still have `secret.key` and the
original `ids.csv` used for that print run, just re-run
`python3 generate_stickers.py ids.csv` on the machine where those live — the
code generation is deterministic (same key + same ID always produces the
same code), so it will reproduce an identical mapping file.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Generate the login accounts:
   ```
   node scripts/generate-users.js
   ```
3. Copy your sticker mapping file into `data/id_token_mapping.csv` (see above).
4. Set up the PHP API first — see `cpanel-api/README.md`. You'll need the
   API URL and API key from that setup for the next step.

## Environment variables (set these in Vercel, not in a local file)

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `PHP_API_URL` | e.g. `https://truelink.et/registeroutlets-api/outlets_api.php` |
| `PHP_API_KEY` | the same `API_KEY` value you set in `cpanel-api/config.php` |
| `SESSION_SECRET` | a long random string — generate with `openssl rand -hex 32` |

**Never commit these to your repository** — they belong only in Vercel's
environment variable settings (and, if testing locally, in a `.env.local`
file that stays out of git).

## Deploying to Vercel

1. Push this project to a GitHub repository (Vercel deploys from Git).
2. Go to [vercel.com](https://vercel.com), sign in, click **Add New →
   Project**, and import that repository.
3. Vercel will auto-detect Next.js — no special build settings needed.
4. Add the three environment variables above before deploying (or add them
   and redeploy if you already deployed once).
5. Deploy. You'll get a URL like `https://truelink-outlet-app.vercel.app`.

### Updating the app later

```
git add .
git commit -m "your change"
git push
```
Vercel redeploys automatically on every push to your main branch.

## Testing locally before deploying

Create a `.env.local` file (never commit this) with the same three
variables pointing at your real PHP API (or a local test setup), then:
```
npm run dev
```

## Notes on the location step

The map has two layers: **Street** (OpenStreetMap) and **Satellite** (Esri
World Imagery) — both free, no API key or billing account required. Staff
can toggle between them and drag the pin (or tap anywhere on the map) to
adjust the detected location before submitting.

Google Maps was considered but requires a billing account (a payment method
on file, even for free-tier usage) — this setup avoids that entirely while
still giving satellite imagery for precise placement.
