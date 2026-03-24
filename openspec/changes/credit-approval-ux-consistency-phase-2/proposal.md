## Why

Stakeholder feedback requires a second UX consistency pass across Credit Approval Home, Inbox, Portfolio Monitoring, and form detail surfaces. The current prototype still has uneven spacing behavior between parent and sub-filters, inconsistent filter semantics between Home and Inbox, incomplete CAD status lifecycle representation, and clipping on form-heavy routes.

## What Changes

- Expand Group/Country CAD lifecycle statuses to `DRAFT`, `PROPOSING`, `APPROVING`, `ACTIVE`, `RETIRED`.
- Reorder CAD and child status cards/sub-filters consistently, while preserving type-specific applicability.
- Standardize Home and Inbox center-card layout rhythm and table-filter placement.
- Move `Status` to the final column in key tables and shorten ownership labels to `RM`, `Proposer`, `Approver`.
- Replace Inbox center quick filters with Inbox Scope controls (`My Inbox`, `Team Inbox`) and remove Inbox Scope from laptop left panel.
- Add mobile-only collapsed rail scope pills (`Me`, `Tm`) after document filter icons with visual separation.
- Replace Portfolio KPI cards with segment exposure cards for `Wealth`, `Retail`, and `SME Business Banking` including utilization and mini trend visuals.
- Reposition FAB stack higher to avoid pagination overlap.
- Remove nested clipping/scroll traps for Group/Country/CET/Sandbox form/detail cards.
- Replace workflow banner stage summary with timeline-style progress.
- Update documentation breadcrumb and responsive width behavior; sync PRD/design/tasks/evidence/timeline references.

## Capabilities

### Modified Capabilities
- `workspace-navigation-context`
- `portfolio-monitoring-hierarchy`
- `document-lifecycle-and-actions`
- `cad-detail-information-architecture`

## Impact

- Runtime UI logic in `prototype/app.js`.
- Responsive/layout behavior in `prototype/styles.css`.
- Sample lifecycle data in `prototype/data/sample-hierarchy.json`.
- OpenSpec documentation index and mirrored artifacts in `prototype/documents/openspec/`.
