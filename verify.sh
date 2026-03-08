#!/usr/bin/env bash
set -euo pipefail

echo "🔎 verify.sh (npm) starting..."

if [ ! -f package.json ]; then
  echo "❌ No package.json found in $(pwd)"
  exit 1
fi

NPM_MAJOR="$(npm --version | cut -d. -f1 || echo 0)"
HAS_WORKSPACES="$(node -e "const p=require('./package.json');process.exit(p.workspaces?0:1)" >/dev/null 2>&1 && echo 1 || echo 0)"

echo "📦 npm version: $(npm --version)"
echo "🧩 workspaces: $([ "$HAS_WORKSPACES" = "1" ] && echo yes || echo no)"

# Install deps if needed
if [ ! -d node_modules ]; then
  echo "📥 node_modules missing — installing deps..."
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
else
  echo "✅ node_modules present — skipping install"
fi

run_root() {
  local script="$1"
  echo "▶ npm run $script (root, if present)"
  npm run --silent --if-present "$script"
}

run_workspaces() {
  local script="$1"
  if [ "$HAS_WORKSPACES" = "1" ] && [ "$NPM_MAJOR" -ge 7 ]; then
    echo "▶ npm run $script (workspaces, if present)"
    npm run --workspaces --silent --if-present "$script"
  fi
}

echo ""
echo "🧪 Running checks (only if scripts exist)..."

# Fast checks first
run_root lint
run_workspaces lint

run_root typecheck
run_workspaces typecheck

# Tests (prefer test:ci if defined)
# Root
if node -e "const p=require('./package.json');process.exit(p.scripts&&p.scripts['test:ci']?0:1)"; then
  run_root "test:ci"
else
  run_root test
fi
# Workspaces (best effort)
run_workspaces "test:ci"
run_workspaces test

# Build last
run_root build
run_workspaces build

echo ""
echo "✅ Verification PASSED."
