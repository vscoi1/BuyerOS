---
name: Debugging Workflow
description: Systematic approach to debugging issues
---

# Debugging Workflow

A structured approach to identify and fix bugs.

## Phase 1: Reproduce & Understand

### 1.1 Get Information
- What is expected behavior?
- What is actual behavior?
- When did it start?
- Any error messages?

### 1.2 Reproduce
1. Follow exact steps to reproduce
2. Note patterns (always, intermittent, specific conditions)
3. Test in different environments

### 1.3 Locate Error

**Check Logs**
```bash
# Application logs
tail -f logs/app.log
# Or check console output
```

**Check Recent Changes**
// turbo
```bash
git log --oneline -10
git diff HEAD~3
```

## Phase 2: Investigate

### 2.1 Binary Search (for regressions)
```bash
git bisect start
git bisect bad HEAD
git bisect good <known-good-commit>
```

### 2.2 Add Debug Output
```javascript
// JavaScript
console.log('[DEBUG]', { variable1, variable2 });
```
```python
# Python
print(f"[DEBUG] {variable=}")
import pdb; pdb.set_trace()
```
```go
// Go
log.Printf("[DEBUG] variable: %+v\n", variable)
```

### 2.3 Common Culprits

| Issue Type | Check |
|-----------|-------|
| Type errors | Run type checker |
| API failures | Check request/response |
| State issues | Add state debugging |
| Database | Check queries, connections |
| Auth | Check sessions, tokens |
| Environment | Check env variables |

## Phase 3: Isolate

### 3.1 Minimal Reproduction
- Remove unrelated code
- Simplify the component
- Test with hardcoded data

### 3.2 Check Dependencies
```bash
# Check versions
npm ls <package>
# pip show <package>
# go list -m all
```

### 3.3 Environment Comparison
- Development vs production?
- Local vs deployed?
- Different env variables?

## Phase 4: Fix

### 4.1 Implement Fix
- Make smallest change that fixes the issue
- Don't fix unrelated issues in same change

### 4.2 Add Defensive Code
```javascript
// Null checks
if (!data?.items) {
  console.warn('Expected items:', data);
  return [];
}
```

### 4.3 Add Regression Test
```javascript
it('should handle edge case (bug #123)', () => {
  const result = buggyFunction(edgeCase);
  expect(result).toBe(expected);
});
```

## Phase 5: Verify

// turbo
```bash
npm run typecheck && npm run test
```

## Debugging Checklist

- [ ] Reproduced the issue
- [ ] Located error source
- [ ] Identified root cause
- [ ] Implemented fix
- [ ] Added regression test
- [ ] Verified fix
- [ ] Cleaned up debug code
