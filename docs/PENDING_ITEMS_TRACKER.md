# BuyerOS Pending Items Tracker

Last updated: 2026-03-09

## Scope of this tracker
Tracks implementation status against the MVP production backlog from `/Users/manigoel/Documents/VSCOI-GIT/BuyersOS/docs/IMPLEMENTATION_PLAYBOOK.md`.

## Status legend
- `DONE`: implemented and verified in code
- `IN_PROGRESS`: partially implemented with known gaps
- `PENDING`: not yet implemented

## P0
- `P0.1 Replace demo auth with production auth`: `IN_PROGRESS`
  - Demo auth exists with env guards.
  - Identity provider integration still pending.
- `P0.2 Enforce true tenant isolation everywhere`: `IN_PROGRESS`
  - Core client/property/off-market flows are scoped.
  - Document access paths required additional hardening.
- `P0.3 Persistent audit logs`: `DONE`
  - Audit events persist to DB with in-memory fallback.
- `P0.4 Env + secrets hardening`: `DONE`
  - Central env validation and fail-fast boot checks are in place.

## P1
- `P1.1 Compliance evidence + policy versioning`: `IN_PROGRESS`
  - Backend supports attach evidence and migrate actions.
  - UI exposure and UX polish required.
- `P1.2 Due diligence adapters`: `IN_PROGRESS`
  - Adapter interfaces wired with mock connector behavior.
  - Real NSW/VIC datasets still pending.
- `P1.3 Document red-flag workflow + human gate`: `IN_PROGRESS`
  - Flag extraction + approve/reject implemented.
  - Publication-grade gating and stricter role controls being completed.
- `P1.4 Off-market routing quality`: `IN_PROGRESS`
  - Ranked recommendation logic exists.
  - SLA analytics and richer eligibility signals pending.
- `P1.5 Portal security hardening`: `IN_PROGRESS`
  - Token hashing + revoke implemented.
  - Rotation UX and one-time links pending.

## P2
- `P2.1 Redis integration`: `PENDING`
- `P2.2 Queue workers`: `PENDING`
- `P2.3 Search engine integration`: `PENDING`
- `P2.4 Billing readiness`: `PENDING`
- `P2.5 Buyer acquisition surfaces`: `PENDING`

## Current engineering focus
1. Close P0.2 document-scope hardening across all document routes.
2. Finish P1.1 UI completion for evidence attachment + policy migration.
3. Strengthen P1.3 human-approval gates and non-advice UI notices.
