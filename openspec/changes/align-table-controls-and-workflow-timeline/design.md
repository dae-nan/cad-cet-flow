## Context

The prototype has stable list/detail workflows but list controls are split across top summary cards and table cards, while workflow progress is rendered with a custom horizontal pill row. Stakeholders requested a single pattern: metrics context in first card, table controls inside table card, and a timeline treatment that matches Ant Design's basic timeline language for all workflow-driven detail forms.

## Goals / Non-Goals

**Goals:**
- Standardize Home/Inbox/Portfolio card structure to: first card (`title + subheading + metrics`), second card (`controls + panel head + table`).
- Standardize workflow banner progression using one shared timeline renderer for Group/Country/CET/Sandbox.
- Preserve current behavior for data filtering, search, submit transitions, and decisioning while updating layout/presentation.
- Ensure detail form cards reflow correctly with left panel expanded/collapsed and mobile breakpoints.

**Non-Goals:**
- No migration to React or Ant Design package runtime.
- No changes to backend contracts, workflow stage constants, or decision validation rules.
- No additional navigation model changes outside requested list views and workflow banners.

## Decisions

### Decision 1: List card composition standard
Adopt reusable composition in render methods:
- First card: title, static one-line subheading, metrics.
- Table card: search/filter controls, then panel head, then table and pagination.

Rationale: Keeps context summary distinct from action controls and aligns visual hierarchy across list pages.

### Decision 2: Shared workflow timeline renderer
Create one helper that generates AntD basic-style timeline items with state classes (`done`, `current`, `pending`, `terminal-success`, `terminal-failed`) and reuse it in `renderWorkflowBanner`.

Rationale: One logic path reduces divergence between CAD and CET/Sandbox views while preserving stage/status semantics.

### Decision 3: Status/stage mapping for CET/Sandbox outcome
Use Draft/Proposing/Approving progression with a terminal outcome item that reflects `SUCCESS` or `FAILED`; keep it pending for non-terminal states.

Rationale: Mirrors requested requirement to show terminal status explicitly without changing workflow engine behavior.

### Decision 4: Form responsiveness tightened at CSS layer
Use full-width form controls and timeline layout rules that avoid overflow. Keep existing shell grid behavior and add detail-safe wrapping rules for narrow widths.

Rationale: Low-risk path that solves width and mobile consistency issues without introducing new layout architecture.

## Risks / Trade-offs

- [Risk] Relocating controls can break event expectations tied to old DOM position.
  → Mitigation: Preserve IDs/data attributes and only move markup location.
- [Risk] Timeline state mapping can misrepresent edge stages in rework paths.
  → Mitigation: Keep stage source as existing workflow stage and treat terminal status as additive final step state only.
- [Risk] New responsive rules can unintentionally affect non-detail cards.
  → Mitigation: Scope timeline/form rules to workflow and form containers.
