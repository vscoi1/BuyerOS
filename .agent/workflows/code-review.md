---
name: Code Review
description: Review code for quality, security, and best practices
---

# Code Review Workflow

Systematic approach to reviewing code.

## Quick Checks

// turbo-all

### Run Type Check
```bash
npm run typecheck
# OR mypy . / go vet ./...
```

### Run Linter
```bash
npm run lint
# OR ruff check . / golangci-lint run
```

### Run Tests
```bash
npm run test
# OR pytest / go test ./...
```

## Review Checklist

### 1. Code Quality

#### Readability
- [ ] Clear variable/function names
- [ ] Appropriate comments
- [ ] Consistent style
- [ ] No dead code

#### Structure
- [ ] Single responsibility
- [ ] DRY (no duplication)
- [ ] Functions < 50 lines
- [ ] Proper error handling

### 2. Types

- [ ] No `any` types (TypeScript)
- [ ] Proper type definitions
- [ ] Type assertions justified
- [ ] Null/undefined handled

### 3. Security

- [ ] No secrets in code
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Rate limiting (if needed)
- [ ] Auth checks

### 4. Performance

- [ ] No N+1 queries
- [ ] Appropriate caching
- [ ] Lazy loading where needed
- [ ] No memory leaks

### 5. Testing

- [ ] Tests for new code
- [ ] Edge cases covered
- [ ] No flaky tests

### 6. API Design

- [ ] Proper HTTP methods
- [ ] Consistent responses
- [ ] Error handling
- [ ] Versioning (if needed)

## Common Issues

| Issue | Severity | Fix |
|-------|----------|-----|
| `any` type | Medium | Use specific type |
| Missing error handling | High | Add try/catch |
| No input validation | High | Add validation |
| Secret in code | Critical | Use env variable |
| Console.log left in | Low | Remove |
| TODO without issue | Low | Create ticket |

## Review Response Template

```markdown
## Code Review

### ✅ Approved / ⚠️ Changes Requested / ❌ Needs Major Changes

### What's Good
- 

### Required Changes
- [ ] 

### Suggestions
- 
```
