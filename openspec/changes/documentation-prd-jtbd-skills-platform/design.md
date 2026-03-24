## Context

The current documentation index is useful for browsing recent change artifacts but mixes curated copy with manually maintained timeline entries, which risks drift as more capabilities are added. Product and delivery teams need a documentation system that reads like a full PRD while preserving direct traceability to OpenSpec specs and executable prototype routes.

Stakeholders include Product Managers, Designers, Engineering Leads, RMs/Proposers/Approvers, and Governance Administrators who use docs for alignment, implementation planning, and governance audit review.

## Goals / Non-Goals

**Goals:**
- Reframe Help > Documentation as a PRD-first information architecture.
- Capture persona definitions and journey narratives with JTBD dimensions.
- Provide a structured, machine-readable usecase registry to render timeline and cross-links consistently.
- Ensure every usecase references OpenSpec requirement source, ideal/edge scenarios, sample data, UI route, and data-design notes.
- Keep markdown viewing runtime-based with strict path safety and expanded approved roots.
- Establish reusable skills so the same document workflows can be repeated in future repos/changes.

**Non-Goals:**
- No backend API implementation.
- No changes to prototype business logic outside documentation and viewer routing behavior.
- No replacement of OpenSpec as the canonical requirements system.

## Decisions

### Decision 1: PRD-first docs index with linked markdown artifacts
The index becomes a navigation shell. Authoritative long-form content lives in markdown files (`docs/*.md`) rendered by viewer runtime. This avoids bloating HTML and keeps editing workflows uniform.

Alternative considered: Keep all content embedded in `index.html`. Rejected due to maintenance overhead and weak review diffs.

### Decision 2: Structured JTBD/usecase source as single timeline truth
Define `data/persona-jtbd-usecases.json` with required fields for persona metadata, JTBD dimensions, scenario details, sample data, UI routes, and OpenSpec links. Timeline items are rendered from this source at runtime.

Alternative considered: Continue manual timeline HTML edits. Rejected due to drift risk.

### Decision 3: Split canonical docs into four primary markdown documents
- `master-prd.md`
- `design-persona-journeys.md`
- `jtbd-usecases.md`
- `data-design.md`

Each section is separately readable and linkable from the index and timeline.

Alternative considered: Single monolithic document. Rejected for readability and navigation.

### Decision 4: Expand viewer roots with strict allowlist
Viewer keeps `?doc=<relative-path>` and rejects absolute/traversal paths. Allowed roots become:
- `changes/`
- `docs/`

Only `.md` files are renderable.

Alternative considered: generic free-form relative paths. Rejected for security and accidental file exposure concerns.

### Decision 5: Skill pack shipped globally in `$CODEX_HOME/skills`
Install one skill per documentation workflow so future work is prompt-consistent and reusable beyond this repo.

Alternative considered: repo-local skills only. Rejected per user direction for global reuse.

## Risks / Trade-offs

- [Risk] Structured source can still drift from OpenSpec if not maintained. -> Mitigation: include explicit task checklist and spec requirements for per-usecase links/fields.
- [Risk] Viewer allowlist expansion could accidentally over-broaden. -> Mitigation: explicit root allowlist and same validation checks as existing implementation.
- [Risk] Skill quality inconsistency across five skills. -> Mitigation: use skill-creator scaffold style and quick validation for each.
- [Risk] Comprehensive PRD may become stale over time. -> Mitigation: include clear “source baseline date” and explicit update workflow references.

## Migration Plan

1. Create OpenSpec artifacts and specs for documentation platform behavior.
2. Add markdown document corpus and structured JTBD/usecase JSON source.
3. Update docs index to consume structured source and generate timeline/persona mappings.
4. Update viewer allowlist for `docs/` and maintain safe path checks.
5. Mirror new change artifacts into prototype docs mirror directory.
6. Create and validate global skills.

Rollback strategy: revert docs index/viewer and remove new docs/source files; existing `changes/...` viewer flow remains functional.

## Open Questions

- None. Scope and defaults are fixed by this implementation change.
