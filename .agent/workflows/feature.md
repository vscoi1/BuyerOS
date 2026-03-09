---
name: Feature Development
description: End-to-end workflow for developing a new feature
---

# Feature Development Workflow

Structured approach for implementing any new feature.

## Phase 1: Planning

### 1.1 Requirements
- [ ] Clarify feature scope
- [ ] Identify affected components (UI, API, DB, state)
- [ ] Check for existing patterns in codebase
- [ ] Identify breaking changes

### 1.2 Design
Create implementation plan with:
- Problem description
- Proposed changes by component
- File modifications
- Verification plan

### 1.3 Approval
Get user approval before proceeding.

## Phase 2: Database (if needed)

- [ ] Design schema changes
- [ ] Create migration file
- [ ] Apply migration locally
- [ ] Test rollback

## Phase 3: Backend

### 3.1 Business Logic
- [ ] Create/modify service layer
- [ ] Implement core functionality
- [ ] Add error handling

### 3.2 API Layer
- [ ] Create/modify endpoints
- [ ] Input validation
- [ ] Authentication/authorization
- [ ] Response formatting

### 3.3 Types/Models
- [ ] Define data types
- [ ] Add validation schemas

## Phase 4: Frontend

### 4.1 State Management
- [ ] Create/modify state (Redux, Zustand, etc.)
- [ ] Define actions and selectors

### 4.2 Components
- [ ] Create UI components
- [ ] Handle loading/error states
- [ ] Ensure accessibility

### 4.3 Pages/Routes
- [ ] Create/modify pages
- [ ] Add navigation
- [ ] Handle URL parameters

### 4.4 Styling
- [ ] Apply design system
- [ ] Ensure responsive design
- [ ] Add animations if needed

## Phase 5: Testing

- [ ] Unit tests for logic
- [ ] Integration tests for API
- [ ] E2E tests for user flows
- [ ] Edge case coverage

## Phase 6: Verification

// turbo
```bash
# Run full verification
npm run typecheck && npm run lint && npm run test && npm run build
```

## Phase 7: Documentation

- [ ] Update README if needed
- [ ] Add code comments
- [ ] Update API docs
- [ ] Update user docs

## Feature Checklist Template

```markdown
## Feature: [NAME]

### Planning
- [ ] Requirements clarified
- [ ] Design approved

### Implementation
- [ ] Database (if needed)
- [ ] Backend
- [ ] Frontend
- [ ] Styling

### Quality
- [ ] Tests written
- [ ] Verification passes
- [ ] Documentation updated
```
