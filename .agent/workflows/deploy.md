---
name: Deployment Workflow
description: Deploy the application to production
---

# Deployment Workflow

Checklist for deploying to production.

## Pre-Deployment

### Verification
// turbo
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

### Checklist
- [ ] All tests passing
- [ ] No type/lint errors
- [ ] Build succeeds
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Feature flags configured

## Deployment Methods

### Git-Based (Vercel, Netlify, Heroku)
```bash
# Push to main branch
git push origin main
# Auto-deploys via CI/CD
```

### Docker
```bash
# Build image
docker build -t myapp:latest .

# Push to registry
docker push myregistry/myapp:latest

# Deploy
docker-compose up -d
# OR kubectl apply -f k8s/
```

### SSH/Traditional
```bash
# Sync files
rsync -avz --delete ./dist/ user@server:/var/www/app/

# Restart service
ssh user@server 'systemctl restart myapp'
```

### Cloud CLI
```bash
# Vercel
vercel --prod

# AWS
aws deploy create-deployment --application-name MyApp

# GCP
gcloud app deploy

# Azure
az webapp up
```

## Environment Variables

Ensure these are set in production:
```
DATABASE_URL=
API_KEY=
SECRET_KEY=
SENTRY_DSN=
```

## Post-Deployment

### Smoke Test
- [ ] Homepage loads
- [ ] Login works
- [ ] Core feature works
- [ ] API responds

### Monitoring
- [ ] Check error tracking (Sentry, etc.)
- [ ] Check application metrics
- [ ] Check database metrics
- [ ] Review logs

### Rollback (if needed)
```bash
# Git-based
git revert HEAD && git push

# Docker
docker-compose down
docker-compose up -d --pull never myapp:previous

# Vercel
vercel rollback
```

## Deployment Checklist

```markdown
## Deployment: YYYY-MM-DD

### Pre-flight
- [ ] Version: x.x.x
- [ ] CI checks passed
- [ ] Migrations applied

### Deployment
- [ ] Deployed to production
- [ ] Smoke tests passed

### Post-deployment
- [ ] Monitored for 15 minutes
- [ ] No new errors
```
