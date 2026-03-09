---
name: Git Workflow
description: Git conventions and best practices
---

# Git Workflow

Standard git practices for the project.

## Branch Naming

```
feature/  - New features
bugfix/   - Bug fixes
hotfix/   - Urgent production fixes
docs/     - Documentation
refactor/ - Code refactoring
test/     - Test additions

Examples:
feature/user-authentication
bugfix/cart-total-calculation
hotfix/payment-timeout
```

## Commit Messages

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructure
- `test` - Tests
- `chore` - Maintenance

### Examples
```
feat(auth): add password reset functionality

- Add forgot password page
- Add email sending service
- Add reset token validation

Closes #123
```

```
fix(cart): correct total calculation with discounts

The discount was being applied after tax instead of before.
```

## Common Commands

### Start New Feature
```bash
git checkout main
git pull origin main
git checkout -b feature/my-feature
```

### Commit Changes
```bash
git add .
git commit -m "feat: add new feature"
```

### Push and Create PR
```bash
git push origin feature/my-feature
# Create PR in GitHub/GitLab
```

### Update Branch with Main
```bash
git checkout main
git pull origin main
git checkout feature/my-feature
git rebase main
# OR git merge main
```

### Squash Commits
```bash
git rebase -i HEAD~3  # Squash last 3 commits
```

### Undo Last Commit
```bash
git reset --soft HEAD~1  # Keep changes staged
git reset --hard HEAD~1  # Discard changes
```

### Stash Changes
```bash
git stash
git stash pop
git stash list
```

## Pull Request Guidelines

### Title Format
```
[TYPE] Brief description
```

### PR Template
```markdown
## Description
What does this PR do?

## Changes
- Change 1
- Change 2

## Testing
How was this tested?

## Screenshots
(if applicable)

## Checklist
- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
```

## Protected Branches

Configure these protections for `main`:
- [ ] Require PR reviews
- [ ] Require CI to pass
- [ ] Require up-to-date branch
- [ ] No force push

## Tagging Releases

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## .gitignore Essentials

```
# Dependencies
node_modules/
venv/
vendor/

# Build
dist/
build/
.next/

# Environment
.env
.env.local
*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/
```
