## 1. OpenSpec Artifacts

- [x] 1.1 Create proposal documenting PRD-first documentation platform scope and capabilities.
- [x] 1.2 Create design with IA, structured source model, viewer policy, and migration decisions.
- [x] 1.3 Create specs for docs platform behavior, viewer runtime policy, and skills pack expectations.

## 2. Documentation Corpus and Source Model

- [x] 2.1 Add comprehensive master PRD markdown covering all active OpenSpec changes, NFRs, success metrics, and OKRs.
- [x] 2.2 Add design markdown with persona catalog, hypothetical character cards, and journey narratives.
- [x] 2.3 Add JTBD/usecase markdown with per-usecase links to OpenSpec specs, ideal/edge scenarios, sample data, UI routes, and data-design notes.
- [x] 2.4 Add standalone data-design markdown for APIs, data model contracts, and source schema.
- [x] 2.5 Add structured JSON source file for persona/JTBD/usecase records used by timeline generation.

## 3. Help > Documentation Runtime Updates

- [x] 3.1 Reorganize docs index into PRD-first sections with links to markdown artifacts.
- [x] 3.2 Replace hard-coded timeline entries with runtime rendering from structured source file.
- [x] 3.3 Keep persona filters and map generated journey items to JTBD/usecase records.
- [x] 3.4 Extend markdown viewer allowlist to support approved docs roots while preserving safety checks.

## 4. Mirror and Global Skills

- [x] 4.1 Mirror new OpenSpec change artifacts into `prototype/documents/openspec/changes/documentation-prd-jtbd-skills-platform/`.
- [x] 4.2 Create global reusable skills in `$CODEX_HOME/skills`:
  - `openspec-prd-comprehensive`
  - `openspec-design-persona-journeys`
  - `openspec-jtbd-usecase-mapper`
  - `openspec-persona-timeline`
  - `openspec-markdown-viewer-runtime`
- [x] 4.3 Validate all five skills (quick script checks + smoke checks; `quick_validate.py` unavailable due missing `PyYAML` in environment).

## 5. Validation

- [x] 5.1 Run `openspec status --change documentation-prd-jtbd-skills-platform --json` and confirm artifact completion.
- [x] 5.2 Verify docs index links render through viewer for master PRD/design/JTBD/data-design.
- [x] 5.3 Verify viewer rejects disallowed path formats and supports approved roots.
- [x] 5.4 Verify generated persona timeline matches structured source entries.
