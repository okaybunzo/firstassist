# FirstAssist

A standalone field service / maintenance management app: clients, sites,
assets, maintenance schedules, jobs, inspections, issues, parts, quoting,
and reports. See `docs/architecture.md` for the data storage design
decisions (no Microsoft 365 dependency in the MVP).

## Stack

- `backend/` — Node.js + TypeScript, Express, Prisma, PostgreSQL
- `frontend/` — React + TypeScript, Vite

## Local development

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
   (defaults to `admin@firstassist.local` / `changeme123` — change
   this before using anything beyond local dev). Additional users can
   be created afterwards by an admin via `POST /api/users`.
3. Frontend:
   ```
   cd frontend
   npm install
   npm run dev
   ```
   App runs on `http://localhost:5173` and proxies `/api` and `/uploads`
   to the backend. Every route except `/login` requires a signed-in
   session.

## Data & files

- All core data (clients, sites, assets, jobs, inspections, issues,
  parts, quotes, reports) lives in Postgres via Prisma.
- Uploaded photos/attachments and generated PDF reports are stored on
  local disk under `backend/uploads/`.
