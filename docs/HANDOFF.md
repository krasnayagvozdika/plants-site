# Handoff

## Current state

- Public demo is deployed through Render from GitHub.
- Render is used only as a demo environment.
- The main goal after demo review is migration to the enterprise hosting.

## Current architecture

- Public catalog reads local data from `data/catalog.json`.
- Admin panel lives under `admin/`.
- Server-side logic is implemented in PHP under `backend/`.
- Uploaded images are stored in `images/catalog/`.
- Admin password can be changed from the admin UI.
- Local password overrides are written to `backend/config.local.php`.

## Important note about Render

- Render Free is acceptable for demo only.
- Runtime-written files may not be reliable there long-term.
- This affects:
  - `data/catalog.json`
  - `images/catalog/`
  - `backend/config.local.php`

For the real hosting, the project is expected to work directly from the host filesystem.

## Admin entry

- URL: `/admin/login.php`
- Default login: `admin`
- Default password: `change-me-now`

If the password was changed through the admin UI, the new value is stored in `backend/config.local.php`.

## What was implemented

- Local catalog without Google Sheets dependency.
- Admin login/logout.
- Add/edit/delete catalog items.
- Drag-and-drop image upload.
- Category management with rename propagation across catalog items.
- Compact technical admin list with internal scroll.
- Docker-based setup for Render demo deployment.

## Transfer target

When moving to the real host, verify:

1. PHP execution works.
2. File writes are allowed in:
   - `data/`
   - `images/catalog/`
   - `backend/` for `config.local.php`
3. Preferably `GD` is enabled for image resizing/compression.

## Key files

- `Dockerfile` — Render demo deployment
- `data/catalog.json` — catalog source
- `admin/index.php` — main admin UI
- `backend/` — PHP backend logic
- `docs/architecture.md` — architecture notes

## Next-session reminder

If a new session starts, the intended continuation is:

- inspect current Render-based demo state;
- then prepare and adapt deployment for the real enterprise host.
