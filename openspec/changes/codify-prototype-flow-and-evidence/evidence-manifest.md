# Evidence Manifest

This manifest links captured artifacts to baseline behavior scenarios for `codify-prototype-flow-and-evidence`.

## Artifact Index

| Evidence ID | Primary Route/View | YAML Snapshot | PNG(s) | Console Log | Notes |
|---|---|---|---|---|---|
| E-001 | CET detail (`#/cad/G-CAD-1001/india/C-CAD-IN-01/CET-IN-202`) | `.playwright-cli/page-2026-03-04T12-51-30-329Z.yml` | `.playwright-cli/page-2026-03-04T12-54-16-969Z.png`, `.playwright-cli/page-2026-03-04T12-59-31-665Z.png`, `.playwright-cli/page-2026-03-04T13-00-05-206Z.png` | `.playwright-cli/console-2026-03-04T12-51-30-109Z.log` | Shows CET summary, section ownership badges, issue panel actions. |
| E-002 | Group CAD detail (`#/cad/G-CAD-1001`) | `.playwright-cli/page-2026-03-04T13-00-28-613Z.yml` | `.playwright-cli/page-2026-03-04T13-00-35-655Z.png` | `.playwright-cli/console-2026-03-04T12-51-30-109Z.log` | Shows Country CAD child list and drill links. |
| E-003 | Country CAD detail (`#/cad/G-CAD-1001/india/C-CAD-IN-01`) | `.playwright-cli/page-2026-03-04T13-25-06-610Z.yml` | `.playwright-cli/page-2026-03-04T13-24-10-313Z.png`, `.playwright-cli/page-2026-03-04T13-25-28-592Z.png` | `.playwright-cli/console-2026-03-04T13-38-59-293Z.log` | Shows child CET/Sandbox list and section-status sidebar. |
| E-004 | CET detail (`#/cad/G-CAD-1001/india/C-CAD-IN-01/CET-IN-202`) | `.playwright-cli/page-2026-03-04T13-38-59-476Z.yml` | `.playwright-cli/page-2026-03-04T13-39-10-339Z.png`, `.playwright-cli/page-2026-03-04T13-39-37-708Z.png` | `.playwright-cli/console-2026-03-04T13-38-59-293Z.log` | Additional CET validation and governance panel evidence set. |
| E-005 | Country CAD summary/detail (`#/cad/G-CAD-1001/india/C-CAD-IN-01`) | `.playwright-cli/page-2026-03-04T13-40-06-940Z.yml` | `.playwright-cli/page-2026-03-04T13-40-23-923Z.png`, `.playwright-cli/page-2026-03-04T13-40-53-224Z.png` | `.playwright-cli/console-2026-03-04T13-38-59-293Z.log` | Shows country summary snapshot and parallel child tracks table. |
| E-006 | Group CAD detail (`#/cad/G-CAD-1001`) | `.playwright-cli/page-2026-03-04T13-42-11-589Z.yml` | `.playwright-cli/page-2026-03-04T13-42-21-917Z.png` | `.playwright-cli/console-2026-03-04T13-38-59-293Z.log` | Confirms Group CAD detail route and country drill-down continuity. |

## Console Findings

- Both captured console logs include only a favicon 404 for `http://127.0.0.1:4173/favicon.ico`.
- No functional runtime errors are recorded in these logs.
- Classification: non-blocking prototype noise.

## Source Code Anchor Index

- `prototype/app.js:236-263` common search/filter path, governance-alerts threshold filter.
- `prototype/app.js:380-410` route parser including fallback + child depth mapping.
- `prototype/app.js:1149-1274` hierarchy table rendering for all/group/country/cet/sandbox modes.
- `prototype/app.js:1276-1524` left-panel behavior by top-level vs detail routes.
- `prototype/app.js:2169-2195` breadcrumb construction by route class.
- `prototype/app.js:2197-2332` issue recomputation and summary categorization.
- `prototype/app.js:2339-2401` right-panel hide/reopen behavior + submit disable gate.
- `prototype/app.js:2403-2462` issue jump and governance modal rendering.
- `prototype/app.js:2464-2564` CET create drawer + required-field validation + draft creation.
- `prototype/app.js:2945-2956` create-drawer submit click handler.
- `prototype/app.js:2988-2993` Help FAB documentation action opens docs index in a new tab/window.
- `prototype/documents/openspec/index.html` mirrored documentation entrypoint and capability link surface.

## Scenario Traceability Matrix

| Scenario ID | Capability + Scenario | Source Logic | Evidence IDs | Status |
|---|---|---|---|---|
| WNC-1 | `workspace-navigation-context` - Home route fallback | `app.js:380-410` | E-002, E-006 | in-sync |
| WNC-2 | `workspace-navigation-context` - CAD route depth mapping | `app.js:399-407` | E-001, E-003, E-005 | in-sync |
| WNC-3 | `workspace-navigation-context` - Detail route breadcrumb context | `app.js:2183-2195`, `app.js:1321-1330` | E-001, E-003, E-005, E-006 | in-sync |
| WNC-4 | `workspace-navigation-context` - List route breadcrumb context | `app.js:2171-2181`, `app.js:1347-1353` | E-002, E-006 | in-sync |
| WNC-5 | `workspace-navigation-context` - Top-level view controls | `app.js:1355-1415`, `app.js:1456-1458` | E-002, E-006 | in-sync |
| WNC-6 | `workspace-navigation-context` - Detail view controls | `app.js:1304-1345`, `app.js:1456-1458` | E-001, E-003, E-005 | in-sync |
| PMH-1 | `portfolio-monitoring-hierarchy` - All-type portfolio view | `app.js:1251`, `app.js:1192-1214` | E-002, E-003, E-005, E-006 | in-sync |
| PMH-2 | `portfolio-monitoring-hierarchy` - Type-constrained portfolio view | `app.js:1252-1255`, `app.js:1514-1521` | E-002, E-003, E-005 | in-sync |
| PMH-3 | `portfolio-monitoring-hierarchy` - Governance alerts quick filter | `app.js:247-250`, `app.js:1367-1369` | E-001, E-004 | in-sync |
| PMH-4 | `portfolio-monitoring-hierarchy` - Search across key row attributes | `app.js:236-263` | E-002, E-003 | in-sync |
| PMH-5 | `portfolio-monitoring-hierarchy` - Expand and drill into a child | `app.js:2861-2867`, `app.js:1133-1137`, `app.js:1204` | E-002, E-003, E-006 | in-sync |
| PMH-6 | `portfolio-monitoring-hierarchy` - Sort and optional column behavior | `app.js:1180`, `app.js:2891-2895` | E-002, E-005 | in-sync |
| CGV-1 | `cet-governance-validation` - Validation with failing checks | `app.js:2215-2295`, `app.js:2313-2318` | E-001, E-004 | in-sync |
| CGV-2 | `cet-governance-validation` - Validation with no issues | `app.js:2327-2333`, `app.js:2391` | E-004 | in-sync |
| CGV-3 | `cet-governance-validation` - Issues present | `app.js:2355-2358` | E-001, E-004 | in-sync |
| CGV-4 | `cet-governance-validation` - Issues resolved | `app.js:2355-2358` | E-004 | in-sync |
| CGV-5 | `cet-governance-validation` - Open governance modal | `app.js:2413-2417`, `app.js:2425-2462` | E-001, E-004 | in-sync |
| CGV-6 | `cet-governance-validation` - Jump from issue to section | `app.js:2403-2410`, `app.js:2376` | E-001, E-004 | in-sync |
| CGV-7 | `cet-governance-validation` - Heavy section auto-hide | `app.js:2339-2347` | E-001, E-004 | in-sync |
| CGV-8 | `cet-governance-validation` - Context return and reopen | `app.js:2348-2351`, `app.js:2387-2389` | E-001, E-004 | in-sync |
| CCT-1 | `cet-creation-evidence-traceability` - Missing required fields | `app.js:2492-2503`, `app.js:2950-2953`, `app.js:2621` | E-003, E-005 | in-sync |
| CCT-2 | `cet-creation-evidence-traceability` - Valid required fields | `app.js:2950-2956`, `app.js:2506-2564` | E-003, E-005 | in-sync |
| CCT-3 | `cet-creation-evidence-traceability` - Draft derivation from parent country CAD | `app.js:2514-2556` | E-003, E-005 | in-sync |
| CCT-4 | `cet-creation-evidence-traceability` - Scenario-to-artifact trace entry | `evidence-manifest.md` (this section) | E-001..E-006 | in-sync |
| CCT-5 | `cet-creation-evidence-traceability` - Console quality signal capture | `evidence-manifest.md` Console Findings | E-001..E-006 | in-sync |
| CCT-6 | `cet-creation-evidence-traceability` - Reviewer audits baseline behavior | `evidence-manifest.md` Artifact Index + this matrix | E-001..E-006 | in-sync |
| DEP-1 | `documentation-entrypoint` - Documentation action opens docs index | `app.js:2988-2993` | E-002 | in-sync |
| DEP-2 | `documentation-entrypoint` - Other Help actions remain unchanged | `app.js:2995-2998` | E-002 | in-sync |
| DEP-3 | `documentation-entrypoint` - Docs index link set is complete | `prototype/documents/openspec/index.html` | E-002 | in-sync |

## Audit Notes

- One spec wording adjustment was made during this sync pass:
  - `portfolio-monitoring-hierarchy/spec.md` scenario "All-type portfolio view" now matches implemented hierarchy behavior where CET/Sandbox visibility depends on expansion.
- No prototype runtime code was changed in this audit.
