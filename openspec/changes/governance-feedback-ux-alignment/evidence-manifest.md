# Evidence Manifest

This manifest links smoke-test artifacts to `governance-feedback-ux-alignment` requirements.

## Artifact Index

| Evidence ID | Route/View | Artifact | Notes |
|---|---|---|---|
| GF-001 | Home (`#/home`) | `.playwright-cli/page-2026-03-24T04-11-19-000Z.png` | Confirms data load restored, KPI strip, action filters, explicit RM/Business Proposer/2nd-line columns. |
| GF-002 | Group CAD (`#/cad/G-CAD-1001`) | `.playwright-cli/page-2026-03-24T04-12-08-931Z.png` | Confirms stage banner, role selector, reordered Summary/Strategy before Country CADs, and Name-click table pattern. |
| GF-003 | CET detail submitted to 2nd line | `.playwright-cli/page-2026-03-24T04-12-49-419Z.png` | Confirms 2nd-line decision panel with 3 outcomes and commentary fields. |
| GF-004 | Docs index (`prototype/documents/openspec/index.html`) | `.playwright-cli/page-2026-03-24T04-14-10-439Z.png` | Confirms PRD-first documentation view, app-style banner, persona filters, and timeline-driven feature mapping. |

## Console Findings

- Log file: `.playwright-cli/console-2026-03-24T04-11-12-581Z.log`
- Observed errors: favicon 404 only.
- Functional impact: non-blocking for prototype behavior.

## Scenario Traceability

| Scenario | Source Anchor | Evidence |
|---|---|---|
| Data renders with role columns and KPI consistency | `prototype/app.js` (`renderHome`, `renderInbox`, `renderPortfolio`) | GF-001 |
| CAD detail IA reorder and stage banner | `prototype/app.js` (`CAD_SECTIONS`, `renderGroupDetail`, `renderWorkflowBanner`) | GF-002 |
| Sequential stage and 2nd-line decisioning UI | `prototype/app.js` (`applySubmitTransition`, `renderSecondLineDecisionPanel`) | GF-003 |
| PRD-first docs + persona timeline filter | `prototype/documents/openspec/index.html` | GF-004 |
