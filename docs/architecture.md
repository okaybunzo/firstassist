# FirstAssist MVP Architecture

## Design decision: standalone app, no Microsoft 365 integration in the MVP

FirstAssist is a field service / maintenance management app (clients, sites,
assets, jobs, inspections, issues, parts, quoting, reports). For the first
version we deliberately avoid Microsoft SharePoint/Teams/Graph integration:

- The app's own database is the source of truth for all core data:
  clients, sites, assets/equipment, maintenance schedules, jobs/work orders,
  inspection forms, checklist results, issues/defects, parts, quote-ready
  items, and reports.
- The app's own file storage holds job photos, asset photos, issue photos,
  attachments, and generated PDF maintenance reports.
- No Microsoft Graph API calls, no SharePoint Lists as data storage, no
  Teams integration.

Rationale: a reliable, self-contained app ships faster and has no
dependency on tenant-specific Microsoft 365 configuration, license tiers,
or Graph API throttling/permissions. Office staff can still manually save
exported PDFs/CSVs into SharePoint or Teams themselves if they want to.

### MVP exports/imports

- Export a completed maintenance report as PDF (`POST /api/jobs/:id/report`).
- Export quote-ready items as CSV/XLSX (`GET /api/quote-items/export`).
- Import the master price list from Excel (`POST /api/parts/import`).
- No automatic sync to SharePoint/Teams — manual save/upload by staff is
  sufficient for the MVP.

### Later, optional Microsoft 365 features (not in MVP)

- Microsoft Entra ID login (replacing local auth).
- Auto-save generated PDF reports to SharePoint.
- Auto-save job photos to SharePoint.
- Import the price list from an Excel file stored in SharePoint.
- Optional Teams notifications on job completion / new issues.

These are additive integrations behind the existing export/import
endpoints and should not require changing the core data model.

## Stack

- **Backend**: Node.js + TypeScript, Express, Prisma ORM, PostgreSQL.
- **Frontend**: React + TypeScript, Vite.
- **File storage**: local disk under `backend/uploads/`, referenced by
  path from the `Attachment` and `Report` tables. Swappable later for
  S3-compatible storage or SharePoint without touching the data model.
- **PDF generation**: `pdfkit` (server-side, no headless browser
  dependency).
- **Excel/CSV import-export**: `exceljs`.
- **Auth**: local email/password login (bcrypt-hashed passwords), an
  httpOnly JWT cookie for the session, and role checks (`ADMIN`,
  `OFFICE`, `TECHNICIAN`) on the `User` model. No external identity
  provider in the MVP — Entra ID login is a later, optional addition
  that replaces this without changing the rest of the data model.

## Job allocation and role-based visibility

- Admin/office staff see and manage every client, site, asset, job,
  price list item, etc., and allocate jobs to a technician via
  `Job.assignedToId`.
- Technicians only see jobs allocated to them (`GET /api/jobs` and
  `GET /api/jobs/:id` are scoped server-side to `assignedToId`, not
  just hidden in the UI), and can only update a limited set of fields
  on their own jobs (status, notes, completed date) — not reassign,
  retitle, or delete a job. Issues/checklist results they create are
  likewise checked against the job's assignment before the write is
  allowed, and list endpoints for those resources are scoped the same
  way as jobs.
- The frontend nav reflects this: technicians see a single "My Jobs"
  view instead of the full CRM/pricing surface; admin/office see
  everything, including an "assigned to" picker on job creation and
  the job detail page.

## Data model

See `backend/prisma/schema.prisma` for the full schema. Core entities:

| Entity | Purpose |
|---|---|
| `Client` | A customer organization. |
| `Site` | A physical location belonging to a client. |
| `Asset` | Equipment at a site. |
| `MaintenanceSchedule` | Recurring maintenance due dates for an asset. |
| `Job` | A work order (maintenance, repair, or inspection) at a site. |
| `InspectionForm` / `InspectionFormField` | Reusable checklist templates. |
| `ChecklistResult` / `ChecklistAnswer` | A filled-out inspection on a job. |
| `Issue` | A defect found during a job, optionally tied to an asset. |
| `Part` | A priced catalog item (the price list). |
| `QuoteItem` | A quote-ready line item, tied to an issue and/or part. |
| `Report` | A generated PDF maintenance report for a job. |
| `Attachment` | A stored photo/file linked to a job, asset, or issue. |
| `User` | An app login (local auth in the MVP). |

## Repository layout

```
backend/    Express + Prisma API, local file storage, PDF/Excel services
frontend/   React + Vite single-page app
docs/       architecture notes
docker-compose.yml   local Postgres for development
```

## Testing

- **Backend**: Vitest + Supertest integration tests (`backend/tests/`)
  run against a dedicated `firstassist_test` Postgres database (never
  the dev database), truncated and reseeded with a test admin before
  each run. Coverage: auth (login/logout/session gating), CRUD,
  role-gated user management, and the full job workflow (checklist
  submission, issue creation, photo upload, PDF report generation),
  plus price list import/quote export.
- **Frontend**: Playwright end-to-end tests (`frontend/e2e/`) drive the
  real UI against the dev backend/database, covering the same
  auth/CRUD/job-workflow surface from the browser's perspective.
