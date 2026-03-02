# Budget Tracker

A Linear-inspired budget tracking app. Upload invoices (OCR powered by GLM-OCR via Ollama), track expenses, manage recurring subscriptions. Self-hostable, open source.

## Tech Stack

- **Next.js 15** (App Router, Server Actions, React Server Components)
- **PostgreSQL** + **Drizzle ORM**
- **Better Auth** (authentication)
- **shadcn/ui** + **Tailwind CSS v4** (UI)
- **GLM-OCR** via **Ollama** (invoice OCR)
- **RustFS** / S3-compatible storage (file uploads)
- **Recharts** (analytics charts)

## Quick Start (Docker)

```bash
# Clone the repo
git clone https://github.com/your-username/budget-tracker.git
cd budget-tracker

# Start all services
docker compose up -d

# Pull the OCR model
docker compose exec ollama ollama pull glm-ocr

# Run database migrations
pnpm drizzle-kit push

# Open http://localhost:3000
```

## Development

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start PostgreSQL (or use Docker)
docker compose up postgres rustfs ollama -d

# Push database schema
pnpm drizzle-kit push

# Pull the OCR model
ollama pull glm-ocr

# Start dev server
pnpm dev
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/budget_tracker` |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) | - |
| `BETTER_AUTH_URL` | App URL | `http://localhost:3000` |
| `S3_ENDPOINT` | S3-compatible endpoint | `http://localhost:9000` |
| `S3_ACCESS_KEY` | S3 access key | `rustfsadmin` |
| `S3_SECRET_KEY` | S3 secret key | `rustfsadmin123` |
| `S3_BUCKET` | S3 bucket name | `invoices` |
| `S3_REGION` | S3 region | `us-east-1` |
| `OLLAMA_BASE_URL` | Ollama server URL | `http://localhost:11434` |

## Features

- **Dashboard** -- Overview cards, spending charts, recent activity
- **Expenses** -- CRUD with categories, filtering, search
- **Subscriptions** -- Track recurring costs (weekly/monthly/yearly)
- **Invoice Upload** -- Drag-and-drop with automatic OCR extraction
- **Analytics** -- Category breakdowns, monthly trends, CSV export
- **Command Palette** -- Cmd+K for quick navigation
- **Dark Mode** -- Default dark theme, light mode toggle

## License

MIT
