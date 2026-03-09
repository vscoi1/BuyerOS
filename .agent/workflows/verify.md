---
name: Verification Pipeline
description: Run the complete verification pipeline
---

# Verification Pipeline

Run before committing or when verifying codebase quality.

## Pre-flight

1. Ensure dependencies are installed
2. Check for uncommitted changes

## Verification Steps

// turbo-all

### Step 1: Type Checking
```bash
# TypeScript
npm run typecheck
# OR Python
# mypy .
# OR Go
# go vet ./...
```
**Expected**: No type errors.

### Step 2: Linting
```bash
# JavaScript/TypeScript
npm run lint
# OR Python
# ruff check .
# OR Go
# golangci-lint run
```
**Expected**: No linting errors.

### Step 3: Unit Tests
```bash
# Node.js
npm run test
# OR Python
# pytest
# OR Go
# go test ./...
```
**Expected**: All tests pass.

### Step 4: Build Check
```bash
# Node.js
npm run build
# OR Python
# python -m py_compile main.py
# OR Go
# go build ./...
```
**Expected**: Build completes without errors.

### Step 5: E2E Tests (Optional)
```bash
# Playwright
npm run test:e2e
# OR Cypress
# npx cypress run
# OR Selenium
# pytest tests/e2e/
```

## Failure Handling

| Failure | Action |
|---------|--------|
| Type errors | Fix types first |
| Lint errors | Run auto-fix if available |
| Test failures | Debug and fix failing tests |
| Build errors | Check imports and syntax |

## Quick Commands

```bash
# Single line verify (customize for your stack)
npm run typecheck && npm run lint && npm run test && npm run build
```

## Report Template

```markdown
## Verification Results

- [ ] Type check: PASS/FAIL
- [ ] Linting: PASS/FAIL
- [ ] Tests: PASS/FAIL (X/Y passing)
- [ ] Build: PASS/FAIL
```
