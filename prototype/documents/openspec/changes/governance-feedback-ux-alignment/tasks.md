## 1. OpenSpec Artifacts

- [x] 1.1 Create change scaffold for `governance-feedback-ux-alignment`.
- [x] 1.2 Write `proposal.md` with revised staged workflow and role model.
- [x] 1.3 Write `design.md` with personas/stakeholders, journey maps, and wireframes.
- [x] 1.4 Add capability specs for modified and new capabilities.

## 2. Workflow and Access Model in Prototype

- [x] 2.1 Add workflow stage constants and role constants.
- [x] 2.2 Add per-document participants and workflow defaults.
- [x] 2.3 Enforce sequential submit transitions (`RM -> Business Proposer -> 2nd line`).
- [x] 2.4 Enforce role/stage edit permissions for section or document fields.
- [x] 2.5 Restrict creation flows to 1st-line roles.

## 3. Decisioning and Commentary

- [x] 3.1 Add 2nd-line decision panel for CET/Sandbox detail.
- [x] 3.2 Require commentary for caveat/reject outcomes.
- [x] 3.3 Persist section comments and end commentary in workflow state.
- [x] 3.4 Surface prior decision feedback on rework stages.

## 4. UX Consistency Updates

- [x] 4.1 Replace ambiguous ownership display with role-specific columns in key tables.
- [x] 4.2 Make names clickable in list/detail child tables where open action existed.
- [x] 4.3 Align KPI tags across list views (`My Docs`, `Inflight`, `Governance Alerts`, `Closed`).
- [x] 4.4 Reorder CAD detail content flow (`Summary`, `Strategy`, then `Country CADs`).
- [x] 4.5 Add explicit expand/collapse indicator to guidance blocks.
- [x] 4.6 Reduce floating action button sizes.

## 5. Documentation Mirror

- [x] 5.1 Add mirrored change artifacts under `prototype/documents/openspec/changes/governance-feedback-ux-alignment/`.
- [x] 5.2 Update prototype docs index with links to the new change and specs.

## 6. Home + Create CET Refinements (Delta)

- [x] 6.1 Remove Home left-panel action filters; keep top quick filters (`All Docs`, `My Docs`, `Alerts`).
- [x] 6.2 Make Home KPI cards document-type aware and always include Governance Alerts.
- [x] 6.3 Add document-type icons in Home left-panel document filters.
- [x] 6.4 Default table sorting to `Name ASC` with visible sort metadata.
- [x] 6.5 Migrate `participants.secondLineApprover` to canonical `participants.approver` with read fallback.
- [x] 6.6 Reorganize Create CET drawer IA and add dynamic product/segment options from selected parent context.
- [x] 6.7 Add non-blocking Create CET warnings for non-future start date and duplicate CET parameter set.
- [x] 6.8 Grey selected floating create/help actions while keeping click behavior (`Coming Soon`).
- [x] 6.9 Update docs index/timeline copy and mobile behavior to reflect this delta.
