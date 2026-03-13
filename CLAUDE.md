# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm drizzle-kit push     # Push schema changes to the database
pnpm drizzle-kit generate # Generate migration files
```

There are no tests configured in this project.

## Architecture

**Next.js App Router** with all routes under `src/app/`:
- `(app)/` — authenticated routes: dashboard, expenses, subscriptions, analytics, upload, settings
- `(auth)/` — sign-in/sign-up pages
- `api/auth/` — Better Auth API handler
- `api/upload/` — S3 presigned URL generation

**Data flow pattern:**
- UI components call **Server Actions** (`src/actions/`) directly — no API routes for CRUD
- All server actions call `requireSession()` first, which redirects unauthenticated users
- Database queries use Drizzle ORM; schema is in `src/lib/db/schema.ts`
- Form validation uses Zod schemas from `src/lib/validators.ts`; server actions re-validate with the same schemas

**Key libraries:**
- **Better Auth** — email/password auth; configured in `src/lib/auth.ts`, client in `src/lib/auth-client.ts`
- **Drizzle ORM** — PostgreSQL via `@neondatabase/serverless`; schema in `src/lib/db/schema.ts`
- **shadcn/ui** — component library (config in `components.json`, components in `src/components/ui/`)
- **TanStack Table** — used for the expenses/subscriptions data tables (`src/components/data-table/`)
- **Recharts** — charts on the analytics page
- **dnd-kit** — drag-and-drop for reordering
- **nuqs** — URL search params state management

**Database schema** (all tables are user-scoped):
- `user`, `session`, `account`, `verification` — Better Auth managed tables
- `categories` — user-defined expense/subscription categories with color and icon
- `expenses` — one-time expenses; optional FK to `categories` and `invoices`
- `subscriptions` — recurring costs with `frequency` (weekly/monthly/yearly) and `nextDueDate`
- `invoices` — uploaded files with OCR status and extracted data in `ocrData` (JSONB)

**OCR pipeline:** Files are uploaded directly to S3-compatible storage (RustFS) via presigned URLs. The invoice record is created with `ocrStatus: "pending"`, then OCR is triggered via Ollama (`glm-ocr:q8_0` model from [zai-org/GLM-OCR](https://github.com/zai-org/GLM-OCR)) through `src/lib/ocr.ts`. The model is auto-pulled on first request if not already available. Configure via `OCR_MODEL` env var.

## Environment

Requires `.env.local` with `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, S3 credentials (`S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION`), `OLLAMA_BASE_URL`, and optionally `OCR_MODEL` (defaults to `glm-ocr:q8_0`). See README for defaults.

Docker Compose (`docker-compose.yml`) provides PostgreSQL, RustFS (S3), and Ollama for local development.
