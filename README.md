# VolunteerHub

VolunteerHub is a small web application for managing volunteer events, applications, and simple coordinator/admin workflows for the CUET student community.

This repository contains a Vite + React frontend and an Express + MySQL backend. The app supports three roles (volunteer, coordinator, admin), event creation and management, volunteer applications, simple task assignment, and lightweight in-app chatbot support.

## Table of contents

- Features
- Tech stack
- Quick start (development)
- Environment variables
- Database & migration notes
- Important API endpoints
- Key files
- Notes

## Features

- Role-based access: `volunteer`, `coordinator`, `admin`.
- Volunteer dashboard: browse upcoming events, view applied events, and see past events.
- Coordinator dashboard: create/edit events, upload event background images, review/approve applicants, assign tasks.
- Admin panel: manage users, approve coordinators, and monitor totals.
- Auth flows: CUET student verification, password reset, JWT-based auth.
- Profile images: client can upload a profile image which is persisted server-side for cross-device sync.
- Image handling: event background images and profile images are stored as data URLs (LONGTEXT) in the database; client-side compression is applied before upload.
- Browser Credential Management: after successful login the app attempts to store credentials via the Credential Management API to prompt the browser to save passwords.

## Tech stack

- Frontend: React (functional components, hooks), Vite, Tailwind/CSS
- Backend: Node.js, Express
- Database: MySQL (mysql2/promise)
- Auth: JWT

## Quick start (development)

Prerequisites: Node 16+, a running MySQL server (or a remote MySQL-compatible database).

1. Install dependencies:

```bash
npm install
```

2. Copy the environment example and set values:

```bash
cp .env.example .env
# edit .env and provide your DB and secrets
```

3. Start the app (API + frontend concurrently):

```bash
npm run dev
```

4. Run just the API server (useful when working on backend only):

```bash
npm run dev:api
```

5. Build the frontend for production:

```bash
npm run build
npm run preview    # preview the built site
```

## Environment variables

The server supports two connection patterns: a single `DATABASE_URL` (mysql://...) or discrete `MYSQL_*` variables. Common variables used by the backend include:

- `PORT` (default `4000`)
- `JWT_SECRET` (long random secret for JWT signing)
- `DATABASE_URL` (optional; e.g. `mysql://user:pass@host:3306/dbname`)
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` (used if `DATABASE_URL` is not set)
- `MYSQL_SSL`, `MYSQL_SSL_REJECT_UNAUTHORIZED` (for TLS connections)
- Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` or `MAIL_USER` + `MAIL_APP_PASS`
- `GROQ_API_KEY`, `GROQ_MODEL` (optional, for the in-app chatbot)
- `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD` (optional for bootstrapping an admin)
- `ENABLE_DEV_SEED` (set `false` in production to avoid seeding)

See `api/index.js` for more context on supported env variables.

## Database & migration notes

- On startup the backend will ensure the schema exists and run light migrations. That includes ensuring LONGTEXT columns for `events.image_url` and `users.profile_image`.
- If your production DB is read-only to migrations, run the following manually before deploying the updated backend:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image LONGTEXT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url LONGTEXT NULL;
```

- Image storage: images are stored as data URLs in LONGTEXT columns. The app compresses and limits the uploaded base64 payload (approx. 62 KB) to keep DB sizes reasonable.

## Important API endpoints

- `POST /api/auth/login` — authenticate and receive a JWT
- `GET /api/auth/me` — get current user (requires Authorization header)
- `PATCH /api/users/me/profile-image` — update the current user's profile image (data URL payload)
- `POST /api/chatbot/ask` — ask the in-app chatbot (backend calls Groq using `GROQ_API_KEY`)

Refer to `api/index.js` for the full set of endpoints and request/response shapes.

## Key files (quick reference)

- Frontend
	- `src/App.jsx` — central app state and login handler (Credential Management integration)
	- `src/components/TopNav.jsx` — profile menu and profile-image upload
	- `src/pages/VolunteerDashboard.jsx` — applied/upcoming/past events view
	- `src/pages/AuthPage.jsx` — login/register/verification flows (background data load on email blur)
	- `src/pages/Home.jsx` — landing page adjustments

- Backend
	- `api/index.js` — Express app, auth, endpoints
	- `api/db.js` — MySQL init and lightweight migrations (creates schema and ensures LONGTEXT columns)

## Notes & operational tips

- Image size: uploads are constrained by both client-side compression and server checks; keep images small (prefer ~<60KB base64 payload).
- Profile pictures are now persisted to the database for cross-device sync. If you don't see a profile image on another device, ensure your production DB has the `users.profile_image` column and that the backend has been restarted after deploy.
- The app attempts to store login credentials via the browser Credential Management API. Browser behavior varies — if you don't see a save-prompt, check browser password manager settings and test in a Chromium-based browser.

## Contributing

Contributions, bug reports and PRs are welcome. Please open issues for discussion before major changes.

## License

MIT

