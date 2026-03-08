#!/usr/bin/env bash
set -euo pipefail

TARGET_DB_URL="${DATABASE_URL:-${SUPABASE_DATABASE_URL:-}}"

if [[ -z "$TARGET_DB_URL" ]]; then
  echo "Error: DATABASE_URL or SUPABASE_DATABASE_URL must be set."
  exit 1
fi

if [[ "${CONFIRM_DROP:-}" != "DROP_SUPABASE_DB" ]]; then
  echo "Refusing to run destructive reset."
  echo "Set CONFIRM_DROP=DROP_SUPABASE_DB to proceed."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PRISMA_SCHEMA="$ROOT_DIR/packages/db/prisma/schema.prisma"

echo "Dropping and recreating 'public' schema on Supabase target..."
cat <<'SQL' | DATABASE_URL="$TARGET_DB_URL" npx prisma db execute --schema "$PRISMA_SCHEMA" --stdin
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO postgres, service_role;
SQL

echo "Supabase schema reset complete."
echo "Next: npm run db:migrate:supabase"
