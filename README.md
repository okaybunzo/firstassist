# FirstAssist

A standalone field service / maintenance management app: clients, sites,
assets, maintenance schedules, jobs, inspections, issues, parts, quoting,
and reports. See `docs/architecture.md` for the data storage design
decisions (no Microsoft 365 dependency in the MVP).

## Stack

- `backend/` — Node.js + TypeScript, Express, Prisma, PostgreSQL
- `frontend/` — React + TypeScript, Vite

## Local development

### Quick start

```
docker compose up -d   # starts local Postgres
npm run setup           # installs both apps, migrates, seeds demo data
npm run dev              # runs backend (:4000) and frontend (:5173) together
```

Then open `http://localhost:5173` and sign in with `admin@firstassist.local`
/ `changeme123` (see below for the other seeded logins). **Change this
password before using anything beyond local dev.**

If you already have Postgres running locally instead of via Docker,
create a database/role matching `backend/.env.example`'s `DATABASE_URL`
before running `npm run setup`.

### Step by step

1. Start Postgres (via Docker, or use an existing local instance):
   ```
   docker compose up -d
   ```
2. Backend:
   ```
   cd backend
   cp .env.example .env
   npm install
   npm run prisma:migrate
   npm run prisma:seed
   npm run dev
   ```
   API runs on `http://localhost:4000`. The seed script creates the
   first login from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`
   (defaults to `admin@firstassist.local` / `changeme123`), plus an
   `office@firstassist.local` and `tech@firstassist.local` login (same
   password) and a demo client/site/asset/job/inspection
   form/issue/parts/quote item so the app isn't empty on first run.
   Additional users can be created afterwards by an admin via
   `POST /api/users`.
3. Frontend:
   ```
   cd frontend
   npm install
   npm run dev
   ```
   App runs on `http://localhost:5173` and proxies `/api` and `/uploads`
   to the backend. Every route except `/login` requires a signed-in
   session.

## Testing

- Backend: integration tests (Vitest + Supertest) run against a
  separate `firstassist_test` database.
  ```
  cd backend
  createdb firstassist_test   # first time only
  npm test
  ```
  This runs `prisma migrate deploy` against `.env.test`, truncates all
  tables, seeds a test admin, and exercises auth, CRUD, the
  checklist/issue/photo/report job workflow, and price list
  import/export.
- Frontend: end-to-end tests (Playwright) drive the real UI against
  the dev backend and database.
  ```
  cd frontend
  npm run test:e2e
  ```
  This expects the backend to be migrated and seeded (see above) and
  will start the dev servers itself if they aren't already running.

## Data & files

- All core data (clients, sites, assets, jobs, inspections, issues,
  parts, quotes, reports) lives in Postgres via Prisma.
- Uploaded photos/attachments and generated PDF reports are stored on
  local disk under `backend/uploads/`.
