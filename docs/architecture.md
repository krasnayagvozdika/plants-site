# Architecture Draft

## Target model

- Public catalog remains available from the same host.
- Admin panel lives on the same host under `/admin/`.
- Catalog data is stored locally in `data/catalog.json`.
- Uploaded images are stored locally in `images/catalog/`.
- Server-side PHP handles form submission, file naming, and optional image resizing.

## Why this structure

- No dependency on Google Sheets.
- No dependency on external image hosting.
- Can run on conservative shared hosting with PHP and file write access.
- Data and files remain on the same hosting environment.

## Current scaffold

- `admin/login.php` — admin login page
- `admin/index.php` — add, edit, and delete catalog items
- `admin/logout.php` — logout action
- `api/catalog.php` — JSON endpoint mirroring local catalog data
- `backend/` — shared PHP logic
- `data/catalog.json` — local catalog storage
- `images/catalog/` — uploaded catalog images

## Expected next steps

1. Harden authentication and move credentials out of tracked config before deploy.
2. Add CSRF protection and server-side validation rules.
3. Add stricter validation for categories, prices, and file formats.
4. Improve image handling for environments without GD.
