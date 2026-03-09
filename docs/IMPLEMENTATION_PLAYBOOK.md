# BuyerOS Implementation Playbook

Last updated: 2026-03-09
Baseline commit: `563f066`

## 1) Purpose
This document is the build handoff for engineers continuing BuyerOS.
It defines:
- what is already implemented,
- what is still pending,
- the architecture and coding rules to follow,
- how to ship safely without breaking current behavior.

## 2) Current State Snapshot

### 2.1 Implemented now
- Next.js App Router dashboard and portal routes.
- tRPC API with Zod validators.
- Prisma + PostgreSQL persistence with in-memory fallback.
- Core module coverage:
  - Clients: create/update/get/list
  - Brief parser: parse
  - Properties: create/update/list/score recompute
  - Due diligence: run/get
  - Off-market: submit/list/assign
  - Documents: upload initiate/get signed URL
  - Portal: session create, shortlist, milestones, feedback submit
  - Compliance: checklist list/get/update item
- Activity monitoring:
  - Domain event stream
  - Audit trail for sensitive mutations
- Global dashboard search across clients/properties/off-market.
- Vercel deployability and Supabase persistence scripts.

### 2.2 Implemented files (high-signal map)
- App shell/routes: `apps/web/src/app/`
- API routers: `apps/web/src/server/routers/`
- Persistence and fallback: `apps/web/src/server/data/data-access.ts`
- Validation contracts: `apps/web/src/server/validators.ts`
- Audit/events: `apps/web/src/server/audit.ts`, `apps/web/src/server/events.ts`
- Compliance workflow UI: `apps/web/src/components/dashboard/ComplianceWorkbench.tsx`

### 2.3 Known limitations right now
- Demo auth (`x-demo-user`) instead of production identity provider.
- No real queue workers, Redis rate-limit storage, or search engine integration yet.
- Compliance workflow exists but lacks evidence attachments and policy version migration tooling.
- AI is mock/heuristic in places; provenance + confidence governance is incomplete.
- Off-market matching is basic, not a full eligibility/reputation engine.

## 3) Architecture to Follow (Non-Negotiable)

### 3.1 System shape
- Keep **modular monolith** boundaries:
  - `validators` -> `data-access` -> `router` -> `UI`
- All API input/output contracts go through Zod and tRPC.
- Keep persistence behind `data-access.ts` facade.
- Every sensitive mutation must write an audit entry.
- Every domain-relevant workflow transition must emit a domain event.

### 3.2 Module boundaries
- Identity & Access: auth/session/roles/tenant isolation.
- CRM & Pipeline: clients, properties, stages, notes/timeline.
- Property Intelligence: scoring, due diligence, risk flags.
- Off-Market Network: submissions, routing, assignment, reputation.
- Documents: upload metadata, signed access, parsing/red-flag extraction.
- Client Portal: read-scoped visibility and feedback.
- Compliance Engine: checklist templates, execution state, evidence history.

### 3.3 Data and tenancy rules
- Tenant boundary key: `organizationId`.
- Agent boundary key: `agentId`.
- Every read/write query must enforce tenant scope first.
- No direct Prisma usage in UI or router files; go through data-access.

### 3.4 AI safety rules
- Allowed autonomous actions:
  - ingestion normalization,
  - extraction,
  - scoring,
  - summarization,
  - anomaly detection.
- Human-required actions:
  - legal conclusions,
  - client-facing contract/risk decisions,
  - negotiation-impacting external submissions.
- Persist only sanitized AI outputs.
- Store prompt version and confidence for every persisted AI artifact.

## 4) Pending Items Backlog (Priority Ordered)

## P0 - Production Safety and Platform Hardening

### P0.1 Replace demo auth with production auth
- Goal: real auth with org/user role mapping.
- Build:
  - Auth.js + provider integration.
  - Session storage hardening.
  - Role guards at router level (`ADMIN`, `AGENT`, `ASSISTANT`).
- Acceptance:
  - unauthenticated users cannot access dashboard routes,
  - role-restricted actions return `FORBIDDEN`.

### P0.2 Enforce true tenant isolation everywhere
- Goal: no cross-org data visibility.
- Build:
  - audit and test all data-access queries for org + agent scoping,
  - add integration tests for bypass attempts.
- Acceptance:
  - forced ID injection across orgs fails for all modules.

### P0.3 Move audit logs to persistent store
- Goal: immutable audit history survives restarts.
- Build:
  - writeAuditLog should persist to `AuditEvent` table,
  - Activity UI should read persisted logs with pagination.
- Acceptance:
  - restart/deploy does not lose audit timeline.

### P0.4 Environment and secrets hardening
- Goal: deterministic deployment config.
- Build:
  - strict env schema validation at boot,
  - separate preview/prod env docs,
  - fail fast when required env is missing.
- Acceptance:
  - app startup fails with readable error on invalid env.

## P1 - MVP Completion (as promised to pilot agents)

### P1.1 Compliance evidence attachments + policy versioning
- Goal: complete checklist workflow.
- Build:
  - file attachment references per checklist item,
  - policy version migration tool,
  - evidence timestamps + actor signatures.
- Acceptance:
  - checklist item state is fully auditable and exportable.

### P1.2 Due diligence autopilot v1 data connectors
- Goal: replace manual placeholders with data-backed signals.
- Build:
  - NSW/VIC zoning/hazard adapter interfaces,
  - comparable sales adapter,
  - deterministic risk-score composition pipeline.
- Acceptance:
  - report generation uses adapter data and fallback behavior is explicit.

### P1.3 Document red-flag extraction workflow
- Goal: convert uploaded documents into reviewed risk flags.
- Build:
  - async parse job,
  - model output provenance,
  - manual approval gate before client-facing output.
- Acceptance:
  - no legal summary can publish without explicit human approve action.

### P1.4 Off-market routing quality
- Goal: better assignment relevance.
- Build:
  - matching score based on budget/suburb/stage/availability,
  - assignment recommendation list,
  - response SLA status tracking.
- Acceptance:
  - new submissions show ranked eligible agents.

### P1.5 Portal security hardening
- Goal: production-safe portal sessions.
- Build:
  - hashed token storage,
  - rotation/revoke endpoints,
  - strict expiry checks,
  - optional one-time session links.
- Acceptance:
  - expired/revoked token never resolves client data.

## P2 - Scale and Commercial Expansion

### P2.1 Redis integration
- Rate limiting, request dedupe, short-lived caches.

### P2.2 Queue worker layer
- Background jobs for document parse, due diligence refresh, notifications.

### P2.3 Search engine integration
- Meilisearch-backed indexed search with filters and ranking controls.

### P2.4 Billing readiness
- Add subscription entities and usage metrics pipeline.

### P2.5 Buyer acquisition surfaces
- Consumer-facing discovery funnel and premium reports.

## 5) Build Workflow for Any New Feature

Follow this sequence exactly:
1. Add/adjust Zod contract in `validators.ts`.
2. Add/adjust persistence logic in `data-access.ts`.
3. Add/adjust tRPC procedure in module router.
4. Add audit write for sensitive mutation.
5. Add domain event for business-significant transition.
6. Add UI workbench/page wiring.
7. Add tests (unit + integration where applicable).
8. Run verification commands before merge.

## 6) Definition of Done (DoD)
A change is complete only when all are true:
- Feature behavior implemented end-to-end.
- Audit/event instrumentation present.
- Tenant isolation validated.
- No unsanitized AI output persisted.
- Tests updated and passing.
- Commands pass:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  - `./verify.sh`
- README/docs updated if env/API behavior changed.

## 7) Test Strategy Expansion (Required)

### Unit
- Scoring logic
- Compliance item state transitions
- Permission guards

### Integration
- Intake -> parser -> shortlist -> due diligence -> portal visibility
- Compliance checklist update -> audit entry -> activity display
- Cross-tenant access denial on all mutating procedures

### Contract
- tRPC schema backward compatibility for existing clients

### Security
- AuthZ bypass attempts
- Portal token abuse/replay
- Signed URL expiry enforcement

## 8) Delivery Plan Recommendation (Next 8 Weeks)
- Week 1-2: P0.1, P0.2, P0.4
- Week 3-4: P0.3, P1.5
- Week 5-6: P1.1, P1.2
- Week 7: P1.3
- Week 8: P1.4 + pilot hardening

## 9) Engineer Onboarding Quickstart
1. `npm ci`
2. `npm run dev`
3. Optional persistence:
   - set `DATABASE_URL`
   - `npm run db:prepare:demo:supabase`
4. Verify baseline:
   - `./verify.sh`

## 10) Change Control
- Never bypass module boundaries for speed.
- Never ship new mutation endpoints without audit logging.
- Never expose client/legal AI outputs without human approval controls.
- Never merge if verification suite fails.
