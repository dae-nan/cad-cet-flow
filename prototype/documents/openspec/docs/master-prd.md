# Credit Workspace Master PRD

## 1. Problem Framing

Credit Workspace spans CAD/CET/Governance flows across multiple roles, but documentation has historically been fragmented across change-level artifacts. Teams need a single PRD that consolidates intent, scope, behavior, and success criteria while preserving traceability to OpenSpec requirement sources.

## 2. Product Goals

- Provide one authoritative product narrative for all active OpenSpec-delivered capabilities.
- Ensure every user journey can be traced to specs, scenarios, and relevant UI routes.
- Improve readiness for implementation, governance review, and onboarding.

## 3. Non-Goals

- Implementing backend workflow orchestration.
- Replacing OpenSpec change files as canonical requirement deltas.
- Finalizing production KPI calculation formulas.

## 4. Scope Baseline (as of 2026-03-24)

This PRD consolidates these active OpenSpec changes:

- `codify-prototype-flow-and-evidence`
- `governance-feedback-ux-alignment`
- `credit-approval-ux-consistency-phase-2`
- `align-table-controls-and-workflow-timeline`

## 5. Functional Requirements (Consolidated)

1. Help > Documentation opens a documentation index from the prototype (`documentation-entrypoint`).
2. Role/stage workflow is explicit for RM, Business Proposer, Approver, and Governance personas.
3. Home/Inbox/Portfolio and detail surfaces follow consistent interaction and status semantics.
4. CAD/CET lifecycle and governance feedback loops preserve commentary traceability.
5. Documentation links maintain requirement-level traceability to OpenSpec specs.

## 6. Non-Functional Requirements

- **Traceability:** Each journey/usecase maps to OpenSpec capability requirements and scenarios.
- **Maintainability:** Timeline and journey maps are generated from structured source data.
- **Safety:** Viewer prevents path traversal/absolute path access.
- **Responsiveness:** Documentation and viewer remain usable on desktop and mobile widths.
- **Auditability:** Key feature intent and evidence references are discoverable from Help > Documentation.

## 7. Success Metrics

- 100% of persona timeline entries resolve to OpenSpec spec links.
- 100% of JTBD usecases include ideal and edge-case scenarios.
- 100% of usecases include sample data and route links when applicable.
- Documentation update cycle time reduced by eliminating manual timeline drift.

## 8. OKRs

### Objective 1: Make product documentation implementation-ready
- KR1: Publish complete master PRD and design/JTBD/data docs in Help > Documentation.
- KR2: Ensure all timeline entries are data-driven from a single source file.
- KR3: Achieve zero broken links for viewer-backed documents.

### Objective 2: Strengthen requirements traceability
- KR1: Every usecase record links to at least one OpenSpec capability spec.
- KR2: Every usecase includes data-design notes and sample payloads.
- KR3: Governance and product stakeholders can review end-to-end journeys in one page.

## 9. Dependencies and Risks

- Dependency on continued OpenSpec hygiene for spec updates.
- Risk of stale records if source JSON is not updated alongside new changes.

## 10. Traceability Index

- Documentation index: `index.html`
- Viewer contract: `viewer.html?doc=<relative-markdown-path>`
- Structured source: `data/persona-jtbd-usecases.json`
