# BuyerOS AU Safe AI Policy + UI Wording Pack

Last updated: 2026-03-09
Applies to: BuyerOS v1 (NSW + VIC launch scope)

## 1) Policy objective
BuyerOS is an operations platform for licensed buyers' agents. It must provide decision support and workflow acceleration without operating as a legal, financial, or credit advice provider.

## 2) Operating boundary (must hold at all times)
- BuyerOS provides: data extraction, prioritisation, scoring, summaries, alerts, workflow and evidence capture.
- BuyerOS does not provide: legal advice, personal financial product advice, credit assistance recommendations, or final contract conclusions.
- All client-facing legal/risk outputs must be explicitly approved by a human agent before use.

## 3) Allowed autonomous AI actions
- Intake normalization (free text -> structured brief)
- Entity extraction from uploaded documents
- Property matching/scoring recommendations
- Due diligence signal aggregation and draft summaries
- Internal task suggestions and anomaly alerts

## 4) Human-required actions (approval gate)
- Any client-facing legal/risk conclusion
- Any communication that could reasonably be interpreted as legal advice
- Any communication that could reasonably be interpreted as personal financial/credit advice
- Any external submission that can materially affect negotiation strategy

## 5) Mandatory product controls
- Every legal/risk result is marked `Draft` until human approval.
- Unreviewed findings are excluded from client-ready risk summaries.
- Audit trail captures: who approved/rejected, when, and what entity.
- Domain events capture pending approval state and approval outcomes.
- No raw model output is shown to clients without sanitization and review.

## 6) UI wording pack (ship as defaults)

### 6.1 Global AI helper notice
Title: `Decision support only`
Body: `BuyerOS provides operational insights for licensed buyers' agents. It does not provide legal, financial, or credit advice.`

### 6.2 Brief parser output
Title: `Draft brief extraction`
Body: `Review and correct all extracted fields before using them for client recommendations.`

### 6.3 Due diligence panel
Title: `Preliminary risk indicators`
Body: `This summary is operational intelligence only. Confirm legal implications with a licensed conveyancer/solicitor before client communication.`

### 6.4 Red-flag extraction panel
Title: `Review required`
Body: `Extracted findings remain unreviewed until approved by an authorized agent. Unreviewed findings must not be presented as client-ready conclusions.`

### 6.5 Deal risk report panel
Title: `Client-ready output gate`
Body: `Risk reports are generated from approved findings only. If findings are pending review, the report is draft-only and not suitable for client-facing legal conclusions.`

### 6.6 AI assistant panel
Title: `Assistant scope`
Body: `The assistant can navigate data and workflows. It cannot provide legal advice, personal financial advice, or credit recommendations.`

## 7) Release checklist (compliance)
- [ ] Approval gate enforced on legal/risk report generation
- [ ] Approval actions logged in audit trail
- [ ] Pending approval events emitted
- [ ] Non-advice wording visible on AI surfaces
- [ ] Checklist evidence and policy version actions visible in compliance UI

## 8) Escalation protocol
When uncertainty exists about legal/financial interpretation:
1. Mark output as draft.
2. Block client-facing publication path.
3. Route to human reviewer (agent/admin).
4. Record final decision in audit/event streams.
