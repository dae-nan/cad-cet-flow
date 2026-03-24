## Context

The current prototype provides strong navigation and core flow foundations, but stakeholder feedback requires workflow behavior to match the operating model used by governance teams. The key design requirement is to make role responsibilities and stage transitions explicit in both UI and data behavior while preserving the existing strengths of the prototype.

## Goals / Non-Goals

**Goals**
- Model the business process as software workflow with clear role/stage boundaries.
- Ensure role-specific edit rights at section level where applicable.
- Make submission and approval sequence explicit and enforceable.
- Keep list/detail UX patterns consistent across views.
- Capture approver feedback in both section-level and end commentary forms.

**Non-Goals**
- No backend service implementation in this change.
- No KPI formula finalization (KPI shells only).
- No redesign of unrelated visual language.

## Persona / Stakeholder Map

- **1st Line RM**: initiates CAD/CET/Sandbox drafts and owns RM sections.
- **Business Proposer (1st line head)**: reviews business intent by region/country/product/segment and submits to 2nd line.
- **Approver**: approves/rejects with section comments and end commentary.
- **Governance Admin**: configures and enforces policy/application controls; not default proposer/approver.
- **Product/Design/Engineering**: ensure consistency and traceability.

## User Journey Maps

### Journey A: RM to Business Proposer
1. RM opens or creates draft.
2. RM edits RM-owned sections.
3. RM validates and submits to Business Proposer.

### Journey B: Business Proposer to 2nd Line
1. Business Proposer reviews and edits proposer-owned sections.
2. Business Proposer submits to 2nd line.
3. Business sections lock after submission.

### Journey C: 2nd Line Decision
1. 2nd line reviews submitted document.
2. Chooses `Accept`, `Accept with caveats`, or `Reject`.
3. Adds section comments and/or end commentary.
4. System records decision and routes to final or rework state.

### Journey D: Rework Loop
1. Caveat/reject feedback is persisted and surfaced.
2. Document returns to RM or Business Proposer draft sub-state.
3. Assignees address marked sections and resubmit.

### Journey E: Governance Administration
1. Governance configures policy/access controls.
2. Governance monitors enforcement and auditability.

## Key Decisions

### Decision 1: Explicit workflow stage state machine
Stages:
- `DRAFT_RM`
- `DRAFT_BUSINESS_PROPOSER`
- `SUBMITTED_2LOD`
- `DECISION_ACCEPTED`
- `DECISION_ACCEPTED_CAVEATS`
- `DECISION_REJECTED`
- `RETURNED_REWORK_RM`
- `RETURNED_REWORK_BUSINESS_PROPOSER`

### Decision 2: Role-specific ownership columns
Use explicit people columns (`RM`, `Business Proposer`, `Approver`) instead of a single `Owner` field in list views.

### Decision 2.1: Participant key migration
Canonical participant key is `approver`; legacy `secondLineApprover` remains read-compatible for one migration cycle.

### Decision 3: Section-level edit enforcement
Editability is determined by active role + workflow stage + section ownership.

### Decision 4: Approval feedback capture model
2nd-line decision panel requires commentary when outcome is caveat/reject and persists:
- section comments
- end commentary

### Decision 5: Cross-view consistency rules
- Keep search + KPI strip + action filters aligned at top of list views.
- Keep name-as-link behavior for open actions.
- Keep CAD detail ordering: `Summary`, `Strategy`, then `Country CADs`.
- Add visible expand/collapse affordances for guidance blocks.

### Decision 6: Home quick controls and KPI semantics
- Remove Home left-panel action filters.
- Use Home top quick filters: `All Docs`, `My Docs`, `Alerts` (alerts aliases governance alerts behavior).
- Home KPI cards follow selected document type status sets:
  - `group|country`: `Active`, `Retired`, `Draft`
  - `cet|sandbox`: `Draft`, `Inflight`, `Success`, `Failed`
  - plus `Governance Alerts`
- KPI values are derived after active search/filter constraints.

### Decision 7: Create CET information architecture
- Group fields as `Parent Context`, `Commercial Scope`, `Proposal Details`, `Timeline`.
- Product and segment options remain disabled until Country CAD is selected.
- Options derive from selected parent context plus same-lineage siblings.
- Show non-blocking warnings for non-future start date and duplicate CET parameter combination.

### Decision 8: Quick action affordances
Grey out selected create/help options while keeping them clickable; clicking shows `Coming Soon`.

## Text-Only Wireframes

### Wireframe 1: Stage + Role Header
```text
+-----------------------------------------------------------------------------------------+
| Search [____________________]                                          [Create] [?]     |
| Stage: Draft (Business Proposer Review)   Role: Business Proposer (SG, Cards, Retail)  |
| KPIs: [My Scope] [Inflight] [Gov Alerts] [Closed]                                       |
| Actions: [Save] [Submit to 2nd Line]                                                    |
+-----------------------------------------------------------------------------------------+
```

### Wireframe 2: Section Ownership Boundaries
```text
Sections
[A Summary]            Badge: RM                 Editable: Yes
[K 1LOD Proposal]      Badge: Business Proposer  Editable: Yes
[L 2LOD Approval]      Badge: 2nd Line           Editable: No (until submitted)
```

### Wireframe 3: 2nd Line Decision Panel
```text
Decision
( ) Accept
( ) Accept with caveats
( ) Reject

Section Comments:
- [risk/guardrails] ______________________
- [financial/evidence] _________________

End Commentary:
[________________________________________]

[Submit Decision]
```

## Risks / Trade-offs

- More explicit stage logic increases code-path complexity.
- Role simulation in prototype can diverge from future backend entitlements if not synced.
- Returning caveat/reject items to draft must preserve audit comments and not lose traceability.

## Migration Plan

1. Add workflow/participants metadata defaults for all document types.
2. Add role-aware action bar and submission transitions.
3. Add section-level edit enforcement and decision panel capture.
4. Update list/detail view columns/ordering/interaction patterns.
5. Validate via acceptance scenarios and update OpenSpec specs/tasks.
