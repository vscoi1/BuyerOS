---
name: Performance Optimization
description: Analyze and optimize application performance
---

# Performance Optimization Workflow

Systematic approach to performance issues.

## Analysis Tools

### Frontend
- Lighthouse (Chrome DevTools)
- WebPageTest
- React/Vue DevTools Profiler
- Bundle analyzer

### Backend
- Profilers (pprof, cProfile, clinic)
- APM tools (DataDog, New Relic)
- Database EXPLAIN ANALYZE

### Load Testing
```bash
# Basic load test
ab -n 1000 -c 10 https://yoursite.com/

# k6
k6 run loadtest.js

# wrk
wrk -t12 -c400 -d30s https://yoursite.com/
```

## Common Issues & Fixes

### 1. Large Bundle Size

**Identify:**
```bash
# Analyze bundle
npm run analyze
# OR webpack-bundle-analyzer
```

**Fix - Code Splitting:**
```javascript
// Dynamic import
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### 2. Unnecessary Re-renders

**Identify:**
- React DevTools Profiler
- console.log in render

**Fix - Memoization:**
```javascript
const expensive = useMemo(() => compute(data), [data]);
const callback = useCallback((id) => select(id), []);
const MemoChild = React.memo(ChildComponent);
```

### 3. N+1 Database Queries

**Identify:**
```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 'x';
```

**Fix - Batch/Join:**
```sql
SELECT * FROM orders
LEFT JOIN order_items ON orders.id = order_items.order_id
WHERE orders.user_id = 'x';
```

### 4. Missing Indexes

**Identify:**
```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 'x';
-- Look for "Seq Scan"
```

**Fix:**
```sql
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

### 5. Unoptimized Images

**Fix:**
- Use WebP/AVIF format
- Resize to actual display size
- Lazy load below-fold images
- Use CDN

### 6. No Caching

**Fix:**
```javascript
// HTTP caching
res.setHeader('Cache-Control', 'max-age=3600');

// In-memory caching
const cache = new Map();
if (cache.has(key)) return cache.get(key);
```

## Performance Budget

| Metric | Target | Critical |
|--------|--------|----------|
| LCP | < 2.5s | > 4s |
| FID | < 100ms | > 300ms |
| CLS | < 0.1 | > 0.25 |
| Bundle | < 200KB | > 500KB |
| API | < 200ms | > 1s |

## Optimization Checklist

- [ ] Bundle analyzed
- [ ] Images optimized
- [ ] Lazy loading implemented
- [ ] Caching configured
- [ ] Database indexed
- [ ] No N+1 queries
- [ ] Core Web Vitals passing
