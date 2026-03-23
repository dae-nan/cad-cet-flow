## 1. Baseline Discovery and Traceability Setup

- [x] 1.1 Confirm baseline route/view behavior from `prototype/app.js` (`parseRoute`, breadcrumb/render paths, left-panel mode switches).
- [x] 1.2 Confirm baseline portfolio/hierarchy behavior from `renderHierarchyTable`, table filter/sort handlers, and child drill paths.
- [x] 1.3 Confirm baseline CET governance behavior from issue collection, right-panel state logic, and governance modal rendering.
- [x] 1.4 Confirm baseline CET creation behavior from drawer open/validate/create flow and route transition logic.
- [x] 1.5 Maintain and update `evidence-manifest.md` so each major scenario maps to `.playwright-cli` screenshot/YAML/log artifacts.
- [x] 1.6 Confirm Help FAB documentation entrypoint behavior and documentation index coverage.

## 2. Spec and Design Alignment

- [x] 2.1 Validate that `workspace-navigation-context` scenarios match current implemented route and context behavior.
- [x] 2.2 Validate that `portfolio-monitoring-hierarchy` scenarios match implemented hierarchy filtering, sorting, and navigation behavior.
- [x] 2.3 Validate that `cet-governance-validation` scenarios match implemented issue gating, jump actions, and governance modal detail behavior.
- [x] 2.4 Validate that `cet-creation-evidence-traceability` scenarios match implemented create-drawer requirements and draft initialization behavior.
- [x] 2.5 Resolve open questions in `design.md` and update artifacts with final decisions before apply phase.
- [x] 2.6 Add and validate `documentation-entrypoint` capability scenarios for Help → Documentation behavior.

## 3. Apply Readiness and Handoff

- [x] 3.1 Run `openspec status --change codify-prototype-flow-and-evidence --json` and ensure required artifacts are marked complete.
- [x] 3.2 Review proposal/design/specs/tasks as a coherent implementation contract with no contradictory requirements.
- [x] 3.3 Prepare implementation handoff notes: known risks, accepted prototype debt (favicon 404), and evidence review method.
