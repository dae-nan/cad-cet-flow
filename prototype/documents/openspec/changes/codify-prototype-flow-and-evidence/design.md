## Context

The prototype is a static HTML/CSS/JS application centered in `prototype/app.js` with hash-based routing and data-backed rendering from `prototype/data/*.json`. Behavior currently exists as executable logic plus generated QA artifacts (`.playwright-cli` screenshots, accessibility-tree YAML snapshots, and console logs), but there is no formal requirement set that maps expected behavior to evidence.

Primary stakeholders are product/design collaborators aligning CAD/CET user journeys and engineering contributors who need stable requirements before making implementation changes.

## Goals / Non-Goals

**Goals:**
- Define a spec baseline for currently implemented behavior across navigation, portfolio hierarchy, CET governance validation, and CET creation.
- Make acceptance auditable by requiring an evidence manifest that maps scenarios to code paths and logged artifacts.
- Reduce ambiguity before `/opsx:apply` by turning prototype behavior into explicit SHALL requirements.

**Non-Goals:**
- No feature implementation or UI redesign.
- No schema migration or backend integration work.
- No replacement of existing Playwright capture process; only standardization of how its outputs are referenced.

## Decisions

### Decision 1: Treat the existing prototype as source behavior, then codify it
- Rationale: `prototype/app.js` already encodes route handling, filtered views, issue logic, and create flow; drafting specs from this reduces invention risk.
- Alternative considered: Write greenfield product requirements first. Rejected because it risks divergence from tested behavior already captured in artifacts.

### Decision 2: Split requirements by capability boundary rather than by file
- Rationale: Capability-based specs (`workspace-navigation-context`, `portfolio-monitoring-hierarchy`, `cet-governance-validation`, `cet-creation-evidence-traceability`, `documentation-entrypoint`) are easier to evolve and test independently.
- Alternative considered: Single monolithic spec. Rejected due to poor maintainability and weaker traceability.

### Decision 3: Require evidence manifest entries per major scenario
- Rationale: The user already has logged screenshots and page snapshots. Formalizing these as references prevents regressions and enables review without re-running full flows.
- Alternative considered: Keep evidence informal in PR comments. Rejected because it is non-repeatable and hard to audit.

### Decision 4: Keep console logs as quality signals, not blocking acceptance unless functional errors are present
- Rationale: Existing logs only show favicon 404 and do not indicate product-flow failures.
- Alternative considered: Fail acceptance on any console error. Rejected as too strict for prototype context.

## Risks / Trade-offs

- [Risk] Spec captures transient prototype quirks rather than intended product behavior. -> Mitigation: Mark any uncertain behavior as open questions and require explicit confirmation before implementation.
- [Risk] Evidence files may be renamed or regenerated, breaking references. -> Mitigation: Define a stable evidence index file with timestamp, route, artifact path, and scenario ID.
- [Risk] Over-specification slows iteration. -> Mitigation: Limit requirements to behavior with user-facing impact and existing demonstrable logic.
- [Risk] Divergence between spec and app logic after future edits. -> Mitigation: Add tasks for periodic traceability reviews and update requirements alongside behavioral changes.

## Migration Plan

1. Create capability specs and baseline requirements from existing code behavior.
2. Produce an evidence manifest that maps requirements/scenarios to `.playwright-cli` artifacts.
3. Review with stakeholders to resolve open questions and mark accepted baseline.
4. Use resulting specs/tasks as the sole source for apply-phase implementation updates.

Rollback strategy: if the baseline is deemed inaccurate, revert to exploration mode and refine artifacts without changing runtime code.

## Open Questions

- None. This change now treats evidence as change-local until archive, references the current `.playwright-cli` evidence set, and records favicon 404 as accepted non-blocking prototype debt.
