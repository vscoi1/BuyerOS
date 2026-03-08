# BuyerOS

BuyerOS is an AU-first buyers-agent operating system built with Next.js, tRPC, Prisma, and PostgreSQL-compatible persistence.

## Run locally

```bash
npm install
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Persistence modes

BuyerOS supports two modes:

1. Demo mode (ephemeral): no database env var set.
2. Persistent mode: set `DATABASE_URL` (or `SUPABASE_DATABASE_URL`) to a PostgreSQL connection string.

## Supabase setup (persistent data)

1. Create a Supabase project.
2. In Supabase, copy the PostgreSQL connection string.
3. Set env vars locally in `.env`:

```bash
SUPABASE_DATABASE_URL="postgresql://..."
DATABASE_URL="$SUPABASE_DATABASE_URL"
```

4. Generate Prisma client and run migrations:

```bash
npm run db:generate:supabase
npm run db:migrate:supabase
```

5. Seed persistent demo data (idempotent):

```bash
npm run db:seed:supabase
```

Or run migrate + seed together:

```bash
npm run db:prepare:demo:supabase
```

### Optional: drop/reset Supabase schema

This is destructive and removes all existing data in `public` schema.

```bash
CONFIRM_DROP=DROP_SUPABASE_DB npm run db:drop:supabase
```

Drop + migrate in one command:

```bash
CONFIRM_DROP=DROP_SUPABASE_DB npm run db:reset:supabase
```

6. Start the app:

```bash
npm run dev
```

## Deploy on Vercel with Supabase

1. Import this repo in Vercel.
2. Keep project root at repo root (this monorepo is configured via `vercel.json`).
3. Add env vars in Vercel Project Settings:

- `DATABASE_URL` (recommended)
- or `SUPABASE_DATABASE_URL`

4. Deploy.

Notes:
- Without DB env vars, Vercel runs demo/in-memory mode.
- With Supabase DB env vars, data persists across deploys and restarts.

## Quick demo deploy (no database required)

If you only need a showcase deployment:

1. Import repo in Vercel
2. Do not set any database env vars
3. Deploy

The app will boot in seeded in-memory demo mode automatically.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
./verify.sh
```
