# Traceability Matrix — Original Prompt Requirements vs Current Plan (v4)

Date: 2026-04-29  
Source: User’s first prompt + stakeholder feedback block

| Req ID | Original Requirement (from first prompt) | Coverage Status | Mapped Plan Elements | Notes / Ambiguity |
|---|---|---|---|---|
| R01 | Curate stakeholder feedback from Policy & Governance Admins | Covered | T01–T20 consolidated | Feedback decomposed into task inventory with MoSCoW and grooming. |
| R02 | Determine task classification rubric using MoSCoW (incl primary/supporting journeys, complexity, WSJF) | Covered | Rubric section (WSJF-like signal + JC + MoSCoW mapping) | Fully mapped and used to classify tasks. |
| R03 | For each task, annotate associated User Journeys and capabilities | Covered | T01–T20 journey/capability mapping | Complete mapping added. |
| R04 | Classify each task as Must/Should/Could/Would | Covered | T01–T20 MoSCoW ratings | Includes reprioritization after updates. |
| R05 | Add short descriptor of classification reason per task | Covered | Task inventory reason column | Present for all tasks. |
| R06 | Groom each task into OpenSpec-style steps + ideal AC + edge AC + sample data | Covered | T01–T20 grooming | Includes explicit AC and edge scenarios. |
| R07 | Create summary table grouped by journey/capability and MoSCoW | Covered | Grouped summary table | Included in plan structure. |
| R08 | Place all in markdown plan file for branch testing | Partially Covered | Existing `plan.md` file + v4 in chat | Baseline is on disk; latest v4 consolidation still needs write-back to file. |
| R09 | Recommend Kiro/OpenSpec/Speckit/BMAD vs current setup | Covered | Recommendation section | Decision: OpenSpec as source of truth, others as drafting aids only. |
| R10 | Ask clarifying questions where needed | Covered | Clarifications resolved for T13/T18/T05 + simulation scope | Material decisions captured. |

## Stakeholder Feedback Trace (Original Suggestions Block)

| Req ID | Stakeholder Item | Coverage Status | Mapped Tasks | Notes / Ambiguity |
|---|---|---|---|---|
| F01 | Consistent tags under search/header (`My Scope Docs`, `Inflight`, `Governance Alerts`, `Closed`) | Covered | T01 | “My Scope Docs” normalized to `My Docs` in canonical labels. |
| F02 | Need reset button for search? blank should auto-reset | Covered | T02 | Policy chosen: auto-reset on blank; conditional reset control only if query exists. |
| F03 | Move action filters to top | Covered | T03 | Explicit UX relocation task. |
| F04 | Active CAD should not need Save Draft | Covered | T04 | Must-have state/lifecycle guard. |
| F05 | Country CAD restricted by country; global governance roles can access all | Covered | T05 | Finalized: Global Heads read-only + delegated edit grants. |
| F06 | Group CAD section order: Summary/Strategy before Country CADs | Covered | T06 | IA reorder task defined. |
| F07 | Right-side country links + simplify columns (remove redundant country/product text) | Covered | T07 | Includes name link + reduced column set. |
| F08 | Reduce blue + and grey ? button size | Covered | T08 | Could-have visual/interaction fix. |
| F09 | Tests dashboard high-level stats (TTD, Volumes, etc.) | Covered | T09 | KPI model with AC and edge cases. |
| F10 | Names clickable instead of Open | Covered | T10 | Consistency task mapped. |
| F11 | Owner = Proposer + Approver | Covered | T11 | Owner display model updated. |
| F12 | Guidance: add down arrows | Covered | T12 | Guidance affordance task mapped. |
| F13 | Approval conditions like KART workflows | Covered | T13 | Threshold/comparator + ongoing CET + dispensation branches. |
| F14 | Trigger from CAD to New CET with checks | Covered | T13, T19 | Covered in gating + role simulation flow. |
| F15 | If booking volume <= threshold create CET else restrict/dispense | Covered | T13 | Mock thresholds finalized (USD + country overrides). |
| F16 | Test runs in isolation; success/failure paths | Covered | T14, T17, T19 | Lifecycle and decision paths modeled/tested. |
| F17 | Interim CAD change with trace when failed | Covered | T14 | Audit/remediation flow mapped. |
| F18 | Run down current exposures, continue segment exclusion | Covered | T14 | Exposure rundown included. |
| F19 | Continue analysis of existing portfolio | Covered | T17 | Baseline comparison and monitoring. |
| F20 | Analyze missed segments/opportunities/hypothesis | Covered | T16, T17 | Flexible metrics + comparator flow. |
| F21 | Consider Credit Bureau signal linked to CET | Covered | T16 | Added as optional advanced metric example. |
| F22 | Draw as schematic / story-like flow | Covered | T15 | Narrative schematic task added. |
| F23 | Make flow looser/flexible; reduce friction with restricted core metrics | Covered | T16 | Core + optional metric tiering. |
| F24 | Better tracking, compare vs existing CAD | Covered | T14, T17 | Traceability + comparator explicit. |
| F25 | Design like storybook with expert help | Partially Covered | T15 | “Storybook” translated to narrative schematic; visual style detail remains open. |
| F26 | Option B offline Word doc/template CET review | Partially Covered | T18 | Final launch format set to PDF; `.docx` deferred. |

## Additional Post-Prompt Requirements (Now Included)

| Req ID | Added Requirement | Coverage Status | Mapped Tasks | Notes |
|---|---|---|---|---|
| A01 | Simulate role-wise CET flow via role switcher (1st line ↔ 2nd line) | Covered | T19 | Playwright automation + AC added. |
| A02 | Ensure inbox/home/detail state reflects role-switched workflow truth | Covered | T19 (+ gap callouts) | Explicit sync requirements and tests added. |
| A03 | Keep PRD and in-app documentation feature in sync | Covered | T20 | New must-have doc-sync capability. |
| A04 | Trigger OpenSpec capability creation with AC | Covered | T20 + OpenSpec contract | Included as mandatory execution contract. |
| A05 | Trigger Playwright demo across roles | Covered | T19 + Playwright demo contract | Artifacts required in evidence manifest. |

## Ambiguous / Unmapped Items Requiring Later Product Clarification

| Item | Status | Why |
|---|---|---|
| “Pror / rainin / Trans” text fragments | Ambiguous | Interpreted as communication/training schematic intent; no definitive product behavior specified. |
| Exact production policy values for threshold overrides | Ambiguous (for prod only) | Mock values set for branch test; policy owners must confirm real thresholds. |
| Storybook-level UX fidelity expectations | Partially ambiguous | Functional requirement mapped; aesthetic execution criteria not explicitly defined by stakeholder text. |
