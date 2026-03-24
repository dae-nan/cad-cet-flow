## Why

Stakeholder feedback validated the baseline prototype UX but identified high-impact gaps in role clarity, staged submission flow, section-level edit boundaries, ownership semantics, and cross-view consistency. Current behavior does not fully model the intended governance operating model:

- 1st line RM initiates and drafts.
- Business Proposer (1st line head by country/product/segment) reviews and submits onward.
- 2nd line approves with structured outcomes and commentary.
- Governance administers policy and application controls.

Without codifying these, workflow actions and UI affordances remain ambiguous across Home/Inbox/Portfolio/detail views.

## What Changes

- Add a role- and stage-aware lifecycle model for CAD/CET/Sandbox with explicit transitions.
- Add permission requirements for section-level editing by role and stage.
- Add sequential gate requirements (RM -> Business Proposer -> 2nd line).
- Add 2nd-line decision requirements (`Accept`, `Accept with caveats`, `Reject`) with mandatory comment rules.
- Replace ambiguous ownership representation with explicit RM / Business Proposer / Approver semantics.
- Align UX patterns across list/detail views: header metrics, action filters, click targets, section ordering, and affordances.
- Simplify Home quick controls to top-row `All Docs`, `My Docs`, `Alerts` and remove Home left-panel action filters.
- Make Home KPI cards status-aware by selected document type and always include `Governance Alerts`.
- Standardize default table sorting to `Name ASC` with visible sort indicator.
- Improve Create CET IA with grouped sections, dynamic product/segment options from selected parent context, and soft warnings (date + duplicate).
- Apply quick-action `Coming Soon` affordance for disabled-yet-clickable create/help items.
- Keep documentation PRD-first and mobile-friendly while reflecting the latest UX/data contract updates.

## Capabilities

### New Capabilities
- `role-based-access-governance`
- `document-lifecycle-and-actions`
- `cad-detail-information-architecture`

### Modified Capabilities
- `workspace-navigation-context`
- `portfolio-monitoring-hierarchy`
- `cet-governance-validation`

## Impact

- Affects workflow state representation and action semantics in `prototype/app.js`.
- Affects list-table columns, row actions, and consistency patterns in Home/Inbox/Portfolio/Group/Country views.
- Affects section ownership, editability enforcement, and decision capture in CET/Sandbox detail workflows.
- Affects participant data contract (`participants.approver` canonical with `secondLineApprover` read fallback during migration).
- Affects create drawer interaction model and warning state handling.
- Affects floating quick-action menu styling and click responses.
- Adds complete OpenSpec artifacts for implementation and audit readiness under `openspec/changes/governance-feedback-ux-alignment/`.
