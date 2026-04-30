# Policy & Governance Admin Feedback Plan (MoSCoW + OpenSpec Grooming)

## Scope and assumptions
- Audience: Policy & Governance admins, Global Heads/CCOs, country users.
- Planning date: 2026-04-29.
- This document is a planning/grooming artifact only (no implementation in this step).
- Ambiguous feedback text ("Pror", "rainin", "Trans") is interpreted as a request for a clearer, more flexible CET narrative/schematic and better training-style guidance.

## 1) Task classification rubric (MoSCoW with weighted decision cues)

### 1.1 Scoring inputs
Use this lightweight WSJF-style signal before assigning MoSCoW:
- Business Value (BV): 1-5
- Time Criticality (TC): 1-5
- Risk Reduction / Opportunity Enablement (RR/OE): 1-5
- Job Size / Technical Complexity (JS): 1-5 (higher = harder)
- Journey Criticality (JC): 1-5
  - 5 = primary actor journey blocker (Policy/Governance decisioning, CAD/CET compliance)
  - 3 = primary journey enhancer or supporting journey blocker
  - 1 = visual polish / convenience

Priority Signal = (BV + TC + RR/OE + JC) / JS

### 1.2 MoSCoW mapping for this app
- Must Have:
  - Compliance, RBAC, or approval-governance correctness
  - Blocks primary actor journey completion
  - Priority Signal generally >= 3.0
- Should Have:
  - Strong usability/traceability improvements in primary journey
  - No compliance break if delayed
  - Priority Signal generally 2.0-2.9
- Could Have:
  - Quality-of-life or reporting enhancements with moderate value
  - Priority Signal generally 1.2-1.9
- Would Have (later):
  - Nice-to-have, optional channel, or exploratory enhancement
  - Priority Signal generally < 1.2

## 2) User journeys and capabilities model used for annotation

### 2.1 User journeys
- J1: Discover and filter governance work (Home/Inbox/Dashboard)
- J2: Review and navigate CAD details (summary, strategy, country CADs)
- J3: Create and configure CET from CAD context
- J4: Approve/restrict/dispense with policy guardrails and commentary trace
- J5: Monitor outcomes, test progression, and exposure impact
- J6: Share/export governance artifacts for offline review

### 2.2 Capabilities
- C1: Workspace taxonomy, tags, counters, and filters
- C2: Table/list interaction patterns and navigation affordances
- C3: CAD information architecture and sectional navigation
- C4: Role-based access control (country vs global governance)
- C5: Document lifecycle controls and state-dependent actions
- C6: CET initiation rules and approval conditions
- C7: Audit traceability, interim change tracking, and exposure controls
- C8: Test dashboard KPI model and comparatives
- C9: Guided UX affordances and reduced interaction friction
- C10: Offline artifacts and printable templates

## 3) Task inventory with MoSCoW classification

| ID | Task | Journey(s) | Capability(ies) | MoSCoW | Classification reason |
|---|---|---|---|---|---|
| T01 | Standardize header/tags naming and KPI labels (My Docs, Inflight, Governance Alerts, Closed) | J1 | C1 | Should Have | High discoverability gain; not compliance-critical. |
| T02 | Search reset behavior: auto-reset on empty query; hide explicit reset button unless value exists | J1 | C1, C9 | Could Have | UX clarity improvement; low risk if deferred. |
| T03 | Move action filters to top-level placement in workspace | J1 | C1, C9 | Should Have | Prevents confusion in primary triage journey. |
| T04 | Remove/disable "Save Draft" for Active CAD states where drafting is invalid | J2, J4 | C5 | Must Have | Prevents invalid state transitions in governed workflow. |
| T05 | Enforce country-restricted CAD access with global override for Governance/CCO/Global Heads | J2, J4 | C4 | Must Have | Core RBAC and data-governance requirement. |
| T06 | Reorder Group CAD detail sections: Summary, Strategy, then Country CADs | J2 | C3 | Should Have | Aligns with reviewer mental model and faster decision prep. |
| T07 | Add right-side Country CAD quick links; simplify table columns (Name link, CETs, Sandbox, Dispensation, Status) | J2 | C2, C3 | Should Have | Improves navigability, removes redundant metadata. |
| T08 | Reduce size of floating blue (+) and grey (?) action buttons | J1, J2 | C9 | Could Have | UI friction fix; minimal policy impact. |
| T09 | Tests dashboard high-level stats (TTD, Volume, etc.) | J5 | C8 | Could Have | Better monitoring insight; not a blocker for workflow completion. |
| T10 | Make Name clickable instead of separate "Open" action | J1, J2 | C2 | Should Have | Interaction consistency and reduced clicks in core journeys. |
| T11 | Set Owner display model = Proposer + Approver visibility | J1, J2, J4 | C2, C5 | Should Have | Decision accountability clarity in governance views. |
| T12 | Add guidance expand/collapse arrows and clearer progressive guidance | J2, J3 | C9 | Could Have | Improves discoverability of help content. |
| T13 | Implement CET approval conditions (KART-like): ongoing CET check, booking threshold, restriction/dispensation path | J3, J4 | C6 | Must Have | Core policy gating and risk control logic. |
| T14 | Add interim CAD change + trace audit + exposure rundown path when CET fails | J4, J5 | C7 | Must Have | Required for governance traceability and controlled remediation. |
| T15 | CET narrative schematic (story-like flow) for process communication | J3, J4, J5 | C9 | Could Have | Aids understanding/training; lower functional criticality. |
| T16 | Flexible CET metric model with restricted core metrics + optional advanced fields | J3, J5 | C8, C9 | Should Have | Balances governance comparability with lower UX friction. |
| T17 | Compare current test outcomes vs existing CAD baseline | J5 | C8 | Should Have | Critical context for policy decision quality. |
| T18 | Offline CET package export (Word/template) for hard-copy review | J6 | C10 | Would Have | Useful for portability but outside primary in-app journey. |

## 4) OpenSpec-style grooming by task

For each task: implementation steps, ideal acceptance criteria, edge-case acceptance criteria, and sample data.

### T01 - Standardize header/tags naming and KPI labels
- Steps
  - Define canonical label dictionary for workspace counters and status tags.
  - Map legacy labels to canonical labels in UI render layer.
  - Validate consistency across Home, Inbox, and Governance dashboards.
- Ideal acceptance criteria
  - Given any workspace entry page, when counters render, then labels exactly match canonical set: `My Docs`, `Inflight`, `Governance Alerts`, `Closed`.
  - Given identical status data, labels and totals remain consistent across all views.
- Edge-case acceptance criteria
  - Unknown status codes are mapped to `Other` without breaking counters.
  - Empty datasets still render all canonical labels with `0`.
- Sample data
  - `[{status:"INFLIGHT",count:14},{status:"ALERT",count:2},{status:"CLOSED",count:6}]`

### T02 - Search reset behavior
- Steps
  - Apply auto-reset when search input transitions to empty string.
  - Show `Reset` control only when query length > 0 (if retained).
  - Add tests for whitespace-only queries.
- Ideal acceptance criteria
  - Given query `"india"`, when cleared to blank, then full unfiltered results return automatically.
- Edge-case acceptance criteria
  - Query `"   "` behaves as blank and resets.
  - Debounced search does not flicker stale filtered results after clear.
- Sample data
  - Query set: `"india"`, `""`, `"   "` against 25 CAD rows.

### T03 - Move action filters to top
- Steps
  - Relocate action filters to top toolbar near global filters.
  - Preserve filter state behavior and URL/state sync.
  - Validate mobile and desktop wrapping.
- Ideal acceptance criteria
  - Users can discover action filters without scrolling side panels.
- Edge-case acceptance criteria
  - On narrow width, filters collapse into overflow menu with active-state badge.
- Sample data
  - Filter states: `All`, `My Docs`, `Alerts`; active route `#/home`.

### T04 - Remove/disable Save Draft for Active CAD
- Steps
  - Define state matrix where `Save Draft` is invalid (e.g., `ACTIVE`, `UNDER_REVIEW`).
  - Hide or disable action with explanatory tooltip.
  - Add guard on backend/state transition API.
- Ideal acceptance criteria
  - For active CAD, `Save Draft` is not executable from UI or API.
- Edge-case acceptance criteria
  - Deep link/button automation attempts return policy error `DRAFT_NOT_ALLOWED_FOR_STATE`.
- Sample data
  - CAD `CAD-IN-PL-202`, state `ACTIVE`, user role `Governance`.

### T05 - Country-restricted CAD access + global override
- Steps
  - Implement RBAC policy check by role and country scope.
  - Apply policy to list visibility, detail access, and edit permissions.
  - Add audit logs for denied and override accesses.
- Ideal acceptance criteria
  - Country user sees/edits only same-country CADs.
  - Global Head/CCO/Governance can access all country CADs.
- Edge-case acceptance criteria
  - Multi-country assignment grants union scope only.
  - Access revoked mid-session forces re-evaluation and denies stale tabs.
- Sample data
  - User A: `{role:"CountryRisk",countryScope:["IN"]}`
  - User B: `{role:"Governance",countryScope:["*"]}`
  - CADs: `IN`, `SG`, `ID`.

### T06 - Reorder Group CAD sections
- Steps
  - Change detail page section order to Summary -> Strategy -> Country CADs.
  - Keep anchor links and scroll sync accurate.
  - Update any doc screenshots/copy referencing old order.
- Ideal acceptance criteria
  - First view prioritizes Summary and Strategy before country-level breakdown.
- Edge-case acceptance criteria
  - If Summary missing, Strategy appears first without blank section shell.
- Sample data
  - Group CAD `G-CAD-1001` with three country children.

### T07 - Country CAD quick links + simplified columns
- Steps
  - Add right-rail quick links for country CAD names.
  - Simplify country table columns to Name, CETs, Sandbox, Dispensation, Status.
  - Ensure Name is navigable link and redundancy removed.
- Ideal acceptance criteria
  - Reviewer can jump to a country CAD in one click via right rail.
- Edge-case acceptance criteria
  - >50 country CADs trigger searchable quick-link list with virtualization.
- Sample data
  - Rows: `CAD-IN-PL-202`, `CAD-SG-CC-044`, `CAD-ID-PL-112`.

### T08 - Resize floating action buttons
- Steps
  - Reduce FAB dimensions and spacing to avoid obstructing underlying controls.
  - Keep WCAG target size and keyboard focus support.
- Ideal acceptance criteria
  - FABs no longer occlude list controls on 1366x768 and 390x844 screens.
- Edge-case acceptance criteria
  - Zoom 200% still supports tap/click targets and non-overlapping layout.
- Sample data
  - Viewports: `1366x768`, `1024x768`, `390x844`.

### T09 - Tests dashboard high-level stats
- Steps
  - Define KPI cards: `TTD`, `Booking Volume`, `Success Rate`, `Loss Rate`.
  - Add aggregation queries and date-range selectors.
  - Validate metric definitions with governance owners.
- Ideal acceptance criteria
  - Dashboard displays agreed high-level stats with consistent definitions.
- Edge-case acceptance criteria
  - Missing denominators render `N/A` with explanatory tooltip, not zero.
- Sample data
  - `TTD: 18 days`, `BookingVolume: 12.3M`, `SuccessRate: 78%`, `LossRate: 1.8%`.

### T10 - Name clickable instead of Open
- Steps
  - Replace `Open` action with clickable Name link in all relevant tables.
  - Preserve row keyboard navigation and accessibility labels.
- Ideal acceptance criteria
  - Clicking Name opens detail page for CAD/CET/Governance item.
- Edge-case acceptance criteria
  - Ctrl/Cmd-click opens new tab where browser supports it.
- Sample data
  - Table row `Name: CAD-IN-PL-202` route `#/cad/CAD-IN-PL-202`.

### T11 - Owner model = Proposer + Approver
- Steps
  - Update owner field model to show proposer and approver roles/identities.
  - Add fallback rendering for missing approver assignment.
- Ideal acceptance criteria
  - List/detail surfaces show `Owner: <Proposer> | <Approver>`.
- Edge-case acceptance criteria
  - If approver pending: show `Approver: Unassigned` without breaking sort/filter.
- Sample data
  - `proposer:"rpatel"`, `approver:"bchan"`; pending sample `approver:null`.

### T12 - Guidance arrows and progressive help
- Steps
  - Add directional arrows/icons to collapsible guidance modules.
  - Add concise step hints for first-time users.
- Ideal acceptance criteria
  - Users can identify expandable guidance at a glance.
- Edge-case acceptance criteria
  - Guidance modules remember expanded state per session.
- Sample data
  - Guidance sections: `Eligibility Rules`, `Approval Notes`, `Evidence Checklist`.

### T13 - CET approval conditions (KART-like)
- Steps
  - Encode pre-check: existing ongoing CETs for selected CAD.
  - Encode booking threshold rule (e.g., `<= 10M` auto-eligible, else restriction/dispensation path).
  - Support decision branch: create CET, restrict, or initiate dispensation request.
- Ideal acceptance criteria
  - System blocks duplicate-risk CET creation and enforces threshold routing.
- Edge-case acceptance criteria
  - Boundary condition (`exactly 10M`) follows explicit inclusive rule.
  - If dispensation SLA expires, request status escalates to governance queue.
- Sample data
  - Input A: `{cadId:"CAD-IN-PL-202",ongoingCet:false,bookingVolume:8.4}` -> `Create CET`
  - Input B: `{cadId:"CAD-IN-PL-202",ongoingCet:true,bookingVolume:8.4}` -> `Block + explain`
  - Input C: `{cadId:"CAD-IN-PL-202",ongoingCet:false,bookingVolume:12.0}` -> `Restrict/Dispense`

### T14 - Interim CAD change + trace + exposure rundown
- Steps
  - When CET fails, create interim CAD change record with reason and impacted segments.
  - Capture trace logs of add/exclude segment decisions.
  - Launch exposure rundown workflow to monitor runoff.
- Ideal acceptance criteria
  - Failed CET produces auditable interim CAD amendment and exposure action plan.
- Edge-case acceptance criteria
  - Partial failure by segment supports mixed outcomes (some excluded, some retained).
  - Retrospective edits are versioned and non-destructive.
- Sample data
  - CET result: `{cetId:"CET-778",status:"FAILED",segments:["gig-workers-weekly"]}`
  - Interim CAD change: `{changeType:"EXCLUDE_SEGMENT",traceId:"TRC-9901"}`

### T15 - CET narrative schematic
- Steps
  - Design single-page flow schematic from trigger -> test -> success/fail -> follow-up.
  - Link each node to corresponding in-app step and policy rule.
- Ideal acceptance criteria
  - Stakeholders can explain CET lifecycle using one canonical diagram.
- Edge-case acceptance criteria
  - Diagram supports alternative path for dispensation branch and portfolio-only test mode.
- Sample data
  - Node IDs: `trigger`, `eligibility`, `test_run`, `success_path`, `failure_path`, `interim_change`.

### T16 - Flexible metrics model
- Steps
  - Define core mandatory metrics set + optional advanced metrics.
  - Add section-level validation by metric tier.
  - Preserve comparability for governance review packs.
- Ideal acceptance criteria
  - Users can submit CET with core metrics only; advanced metrics enhance but do not block.
- Edge-case acceptance criteria
  - If optional metric provided, unit/format validation still enforced.
- Sample data
  - Core: `bookingVolume`, `delinquency30dpd`, `netLossRate`
  - Optional: `creditBureauScoreDelta`, `portfolioVolatilityIndex`.

### T17 - Compare vs existing CAD baseline
- Steps
  - Add baseline comparator in test dashboard and CET review pages.
  - Show delta indicators (improved/flat/worse) against baseline period.
- Ideal acceptance criteria
  - Governance users can see whether CET outcome is better/worse than current CAD baseline.
- Edge-case acceptance criteria
  - If baseline unavailable for segment, comparator shows `No baseline` and excludes from roll-up score.
- Sample data
  - Baseline loss rate `2.4%`, CET observed `1.8%`, delta `-0.6pp`.

### T18 - Offline CET package export (Word/template)
- Steps
  - Define printable CET package template (summary, metrics, approvals, commentary).
  - Add export action from CET detail.
  - Add watermark/version metadata for audit.
- Ideal acceptance criteria
  - User exports CET package to `.docx` with all key sections and timestamps.
- Edge-case acceptance criteria
  - Large tables paginate without truncation; redacted fields remain redacted in export.
- Sample data
  - CET `CET-778`, 4 metric sections, 12 commentary entries, export version `v1.3`.

## 5) Grouped summary table (by journey/capability and MoSCoW)

| Group | Must Have | Should Have | Could Have | Would Have |
|---|---|---|---|---|
| J1 + C1/C2/C9 (Discovery, filters, interaction consistency) | - | T01, T03, T10, T11 | T02, T08 | - |
| J2 + C3/C4/C5 (CAD navigation, RBAC, lifecycle correctness) | T04, T05 | T06, T07 | T12 | - |
| J3/J4 + C6/C7 (CET policy gating, approval/remediation traceability) | T13, T14 | - | T15 | - |
| J5 + C8 (Monitoring metrics and baseline comparison) | - | T16, T17 | T09 | - |
| J6 + C10 (Offline governance artifact) | - | - | - | T18 |

## 6) Recommended execution sequencing
- Wave 1 (Must): T04, T05, T13, T14
- Wave 2 (Should): T01, T03, T06, T07, T10, T11, T16, T17
- Wave 3 (Could): T02, T08, T09, T12, T15
- Wave 4 (Would): T18

## 7) Recommendation: Kiro vs OpenSpec vs Speckit vs BMAD

Recommendation: keep **OpenSpec as the primary system of record** for this repo, and optionally use Kiro/Speckit/BMAD as upstream drafting aids only.

Why:
- Your repository already has mature OpenSpec structure (`proposal/design/tasks/specs/evidence`) and mirrored docs.
- This feedback maps cleanly into OpenSpec capabilities and change artifacts without migration overhead.
- Governance-heavy work benefits from traceability and explicit acceptance criteria that OpenSpec already enforces.

Suggested operating model:
- Use OpenSpec for formalized artifacts, approvals, and git-based review.
- If desired, use Speckit/Kiro/BMAD to draft early decomposition, then normalize into OpenSpec before implementation.
- Avoid dual authoritative sources to reduce drift.

## 8) Clarifying questions (only where needed before implementation)
1. What is the exact booking-volume threshold and comparator rule for T13 (currency, inclusive boundary, and per-country overrides)?
2. For T18, is `.docx` the only required offline format, or do you also require PDF at launch?
3. For T05, should Global Heads have edit rights across all countries or read-only with explicit delegated edit grants?

## 9) Finalized decisions and execution addendum (2026-04-29)

- T13 threshold/comparator defaults for branch testing:
  - Normalize booking volume to `USD` at CET creation using captured FX snapshot.
  - Comparator is `bookingVolumeUSD <= thresholdUSD` (inclusive boundary).
  - Global default threshold is `10,000,000 USD`.
  - Country overrides (mock): `IN=8,000,000`, `SG=12,000,000`, `ID=6,000,000` (USD).
- T18 launch output format is `PDF` (with `.docx` deferred).
- T05 access model: Global Heads are cross-country read-only by default, with edit rights only via explicit delegated grants.
- Added T19 (Must Have): role-switch simulated journey across RM/Proposer/Approver/Governance roles with draft edit trace, submit, approve/send-back.
- Added T20 (Must Have): PRD and in-app documentation feature must be updated in-sync with OpenSpec capability and acceptance criteria deltas.
- Implementation contract:
  - Specs are the primary artifacts.
  - Prototype UX should stay consistent; where behavior exists, reinforce/update acceptance criteria instead of redesigning UI.
  - Playwright evidence must include role-flow demo artifacts and negative authorization/commentary cases.
