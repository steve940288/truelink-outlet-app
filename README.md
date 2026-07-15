# True Link PLC — Outlet Registration App

A mobile-friendly Next.js web app for scanning outlet stickers and registering
outlets to a database, or looking up outlets that are already registered.
Deployed at **truelink.et/registeroutlets**.

## Login

Every page requires signing in first, so every registration is tied to a
name. Current accounts (change these — see "Managing users" below):

| User | Username | Password |
|---|---|---|
| Redeat | `redeat` | `riwBnxcw9K` |
| Abubeker | `abubeker` | `fbdNQSKhfF` |
| Estephanos | `estephanos` | `kYCPvgi8hD` |
| User 4 | `user4` | `NK3xsPWAMb` |
| User 5 | `user5` | `bjiDWgRHnu` |
| User 6 | `user6` | `CZmvHARvE4` |
| User 7 | `user7` | `qTCbJWJsFq` |
| User 8 | `user8` | `STkBXSXUA2` |
| User 9 | `user9` | `YitaJvEbcN` |
| User 10 | `user10` | `aikTxmY4y4` |

Every outlet registration records which username created it, and the search
list / scan-to-view screens show "Registered by [name]".

**Keep this table somewhere safe (not posted publicly)** — treat it like any
other password list. Passwords are stored as bcrypt hashes in
`data/users.json`, never in plain text.

### Managing users

To change passwords, rename users, or add more:

1. Edit `scripts/generate-users.js` — update the `USERS` array (username,
   displayName, password).
2. Run:
   ```
   node scripts/generate-users.js
   ```
   This overwrites `data/users.json` with fresh bcrypt hashes.
3. Restart the app for the change to take effect.

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

## Deploying on cPanel (truelink.et/registeroutlets)

This app is already configured to run at the `/registeroutlets` path
(see `basePath` in `next.config.js`) and includes `server.js`, the entry
point cPanel's Node.js hosting feature needs.

**Requirements:** your cPanel hosting must support "Setup Node.js App"
(Node.js 18+). Check with your host if you don't see this option in cPanel.

### Steps

1. **Upload the project files** to your hosting account — everywhere
   *except* `node_modules` and `.next` (those get generated on the server).
   Use File Manager or FTP/SFTP. A sensible location is a folder outside
   `public_html`, e.g. `~/registeroutlets-app`.

2. **In cPanel, open "Setup Node.js App" → Create Application:**
   - Node.js version: latest available 18.x or 20.x
   - Application mode: `Production`
   - Application root: the folder you uploaded to (e.g. `registeroutlets-app`)
   - Application URL: choose `truelink.et`, and set the path to `registeroutlets`
   - Application startup file: `server.js`
   - Save/Create.

3. cPanel will show a command to **"Enter to the virtual environment"** —
   something like:
   ```
   source /home/<youruser>/nodevenv/registeroutlets-app/18/bin/activate && cd /home/<youruser>/registeroutlets-app
   ```
   Run that via cPanel's Terminal (or SSH). Then, inside that environment:
   ```
   npm install
   node scripts/generate-users.js
   npm run build
   ```

4. Copy your sticker mapping file into place (see note below):
   ```
   data/id_token_mapping.csv
   ```

5. Back in the "Setup Node.js App" page, click **Restart**.

6. Visit `https://truelink.et/registeroutlets` — you should see the login page.

### Updating the app later

Whenever you change the code or add more outlets to the mapping file:
1. Upload the changed files.
2. Re-enter the virtual environment (step 3 above).
3. Run `npm run build` again if you changed any code (not needed for just
   updating `data/id_token_mapping.csv`).
4. Click **Restart** in "Setup Node.js App".

## Important: how the two QR codes relate

Your stickers (from `generate_stickers.py`) have two QR codes:

- **Left QR** — a public URL like `https://truelink.et/TL-0001` (contains the
  real outlet ID directly)
- **Right QR** — an opaque 6-character code like `778LM0` that is **not**
  derivable from the ID on its own — it only maps back via the
  `id_token_mapping.csv` file the sticker script generates

This app works with **either** QR, but to resolve the right-QR code back to
a real outlet ID, it needs that mapping file. **Copy `id_token_mapping.csv`
(from your `Outputs` folder when you ran `generate_stickers.py`) into this
app's `data/` folder.** Whenever you print a new batch of stickers, copy the
latest mapping file over again.

If that file isn't present, scanning the left QR (URL) still works fine on
its own — only right-QR scans need the mapping file.

**Lost the mapping file?** As long as you still have `secret.key` and the
original `ids.csv` used for that print run, just re-run
`python3 generate_stickers.py ids.csv` — the code generation is
deterministic (same key + same ID always produces the same code), so it
will reproduce an identical mapping file. You don't need to reprint
anything.

## Setup

1. Install [Node.js](https://nodejs.org) 18 or later if you don't have it.
2. In this folder, install dependencies:
   ```
   npm install
   ```
3. Copy your sticker mapping file into place:
   ```
   data/id_token_mapping.csv
   ```
4. Run the app:
   ```
   npm run dev
   ```
5. Open the printed URL (usually `http://localhost:3000`).

## Important: camera + location require HTTPS (or localhost)

Browsers only allow camera and geolocation access on secure origins. This
means:

- Testing on the same computer via `http://localhost:3000` works fine.
- To test on a **phone** on your local network, `http://<your-computer-ip>:3000`
  will **not** be allowed to access the camera (not secure). Options:
  - Deploy it to a real HTTPS domain (e.g. a subdomain of truelink.et)
  - Use a tunneling tool like [ngrok](https://ngrok.com) during testing to
    get a temporary HTTPS URL pointing at your local dev server

## Data storage

- Outlet registrations are stored in `data/outlets.json` — a simple JSON
  file, not a full database. This is intentional (no native database driver
  to install, works anywhere Node.js runs) and is fine for a small internal
  tool used by a handful of staff at a time.
- Uploaded outlet photos are saved to `public/uploads/`.
- **Back up `data/outlets.json` and `public/uploads/` regularly** — there's
  no separate database backing this up for you.

## Notes on the location step

The map has two layers: **Street** (OpenStreetMap) and **Satellite** (Esri
World Imagery) — both free, no API key or billing account required. Staff
can toggle between them and drag the pin (or tap anywhere on the map) to
adjust the detected location before submitting.

Google Maps was considered but requires a billing account (a payment method
on file, even for free-tier usage) — this setup avoids that entirely while
still giving satellite imagery for precise placement.
