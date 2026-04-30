# Credit Workspace Master PRD

## 1. Product Intent

Credit Workspace is a governance decision workspace for CAD/CET flows across 1st-line and 2nd-line actors. This prototype build is intentionally used for discovery: to validate real user journeys, clarify role handoffs, and convert observed behavior into formal requirements.

This PRD is functionally driven and outcome-led. OpenSpec remains the requirement source of truth; this PRD consolidates those requirements into one product narrative.

## 2. Problem Framing

Policy & Governance stakeholders need a single operating flow where users can:
- create and iterate safely in draft,
- hand off through the correct review chain,
- enforce approval authority by role and country,
- preserve auditable commentary and rationale,
- and keep documentation synchronized with evolving requirements.

Without this, teams face inconsistent role behavior, unclear handoffs, and weak traceability between UX, policy logic, and implementation decisions.

## 3. Functional Outcomes (What Users Must Be Able To Do)

1. Discover and triage governance work from Home/Inbox with role-appropriate context.
2. Switch perspective globally (`View as`) to simulate RM, Proposer, 2LoD Editor, 2LoD Approver (CCH), Governance Admin, and Global Head behavior.
3. Create/edit CET drafts in 1st line and persist draft progress (prototype local persistence).
4. Execute explicit handoff flow: `RM -> Proposer -> 2LoD Approver (CCH)`.
5. Allow 2LoD Editor draft input on 2LoD-owned sections without granting final decision authority.
6. Enforce 2LoD Approver decision controls only at the submitted stage, with commentary requirements for caveat/reject paths.
7. Apply country/authority boundaries and delegated governance rules where required.
8. Keep section ownership legible as `1LoD`/`2LoD` for editing accountability.
9. Keep PRD, OpenSpec capabilities, and in-app documentation aligned for review and audit.

## 4. Current Scope Baseline (Prototype Discovery)

This PRD consolidates active OpenSpec changes:
- `codify-prototype-flow-and-evidence`
- `governance-feedback-ux-alignment`
- `credit-approval-ux-consistency-phase-2`
- `align-table-controls-and-workflow-timeline`
- `policy-governance-admin-clarification-phase-3`

## 5. Journey-Driven Requirements

### J1: Discover and triage work
- Users can view role-relevant workload in Home/Inbox.
- Role switches recalculate visible actions and context across routes.

### J2: Draft and iterate safely
- 1st-line users can draft and save progress.
- 2LoD Editor can edit/save 2LoD-owned draft sections and commentary.

### J3: Handoff to decisioning
- RM submits to Proposer.
- Proposer submits to 2LoD Approver (CCH).

### J4: Governed decision and feedback
- 2LoD Approver can accept / accept with caveats / reject at submitted stage.
- Non-accept outcomes require commentary and preserve remediation context.

### J5: Traceability and documentation
- Requirement changes are mirrored in OpenSpec and docs entrypoint.
- Evidence artifacts map scenarios to captured prototype behavior.

## 6. Non-Goals

- No backend orchestration finalization in this prototype phase.
- No production KPI formula finalization in this PRD.
- No replacement of OpenSpec change artifacts as delta-level records.

## 7. Success Metrics

- 100% of targeted role-handoff scenarios are covered by acceptance evidence.
- 100% of required workflow transitions map to explicit role/stage requirements.
- 100% of capability changes are reflected in docs + OpenSpec links.
- Reduced ambiguity in stakeholder review cycles (fewer unresolved requirement disputes per cycle).

## 8. OKRs (Functionally Driven)

### Objective 1: Make role handoffs operationally clear and testable
- KR1: Demonstrate complete `RM -> Proposer -> CCH` flow with captured evidence.
- KR2: Demonstrate separated `2LoD Editor` vs `2LoD Approver` behavior with authority boundaries.
- KR3: Ensure missing-commentary decision constraints are demonstrably enforced.

### Objective 2: Improve draft collaboration without reducing governance control
- KR1: Enable deterministic draft save/resume behavior for 1st-line and 2LoD editor roles in prototype.
- KR2: Keep section ownership understandable using `1LoD`/`2LoD` annotations.
- KR3: Preserve decision-stage controls exclusively for approver roles.

### Objective 3: Keep discovery artifacts decision-ready
- KR1: Maintain one synchronized narrative across PRD, OpenSpec specs, tasks, and evidence manifest.
- KR2: Keep documentation links and capability references review-ready with zero critical gaps.
- KR3: Ensure each accepted requirement has corresponding scenario-level evidence.

## 9. Dependencies and Risks

- Dependency on continuous OpenSpec hygiene for new deltas.
- Risk of stale discovery conclusions if evidence artifacts are not refreshed after behavior changes.
- Risk of overfitting prototype-only behaviors without explicit production transition notes.

## 10. Traceability Index

- Documentation index: `index.html`
- Viewer contract: `viewer.html?doc=<relative-markdown-path>`
- Structured source: `data/persona-jtbd-usecases.json`
- OpenSpec change source: `openspec/changes/policy-governance-admin-clarification-phase-3/`
