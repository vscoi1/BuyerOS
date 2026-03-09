---
name: Agent Skills Reference
description: Overview of all available agent skills
---

# 🧠 Agent Skills Reference

This folder contains specialized instruction files that extend the AI agent's capabilities.

## 📁 Available Skills

| Skill | Command | Purpose |
|-------|---------|---------|
| [verify.md](./verify.md) | `/verify` | Run verification pipeline |
| [feature.md](./feature.md) | `/feature` | End-to-end feature development |
| [debug.md](./debug.md) | `/debug` | Systematic debugging |
| [test.md](./test.md) | `/test` | Testing workflow |
| [deploy.md](./deploy.md) | `/deploy` | Deployment checklist |
| [db-migrate.md](./db-migrate.md) | `/db-migrate` | Database migrations |
| [code-review.md](./code-review.md) | `/code-review` | Code quality review |
| [performance.md](./performance.md) | `/performance` | Performance optimization |
| [ui-component.md](./ui-component.md) | `/ui-component` | UI component patterns |
| [api-route.md](./api-route.md) | `/api-route` | API development |
| [docs.md](./docs.md) | `/docs` | Documentation |
| [git.md](./git.md) | `/git` | Git workflow |

## 🚀 Usage

1. **Automatic**: Agent detects when a skill is relevant
2. **Explicit**: Say `/verify` or "run the verify workflow"
3. **Combined**: "Create a new feature using /feature for payments"

## ⚡ Annotations

- `// turbo` → Auto-runs the next command step
- `// turbo-all` → Auto-runs all commands in the workflow

## 🔧 Customization

Edit any skill file to match your:
- Tech stack (React, Vue, Node, Python, etc.)
- CI/CD system (GitHub Actions, GitLab, etc.)
- Database (PostgreSQL, MongoDB, etc.)
- Cloud provider (Vercel, AWS, GCP, etc.)
