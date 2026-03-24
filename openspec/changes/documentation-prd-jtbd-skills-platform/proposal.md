## Why

Help > Documentation currently surfaces change files but does not provide a unified, PRD-grade narrative across the full product scope, nor a durable JTBD/usecase-to-spec map with sample data and data-design traceability. The team needs a single documentation platform that stays synchronized with persona journeys and OpenSpec capabilities.

## What Changes

- Introduce a PRD-first documentation structure in Help > Documentation with dedicated sections for Master PRD, Design Document, JTBD & Usecases, Data Design, and Feature Timeline by Persona.
- Add a comprehensive master PRD markdown document that consolidates all active OpenSpec changes, requirements, NFRs, success metrics, and OKRs.
- Add a design markdown document with a persona catalog and hypothetical character cards, plus journey narratives organized by JTBD dimensions.
- Add a structured source file for JTBD/usecase records that includes persona, jobs (functional/emotional/social), trigger/outcome, linked OpenSpec spec, ideal scenario, edge cases, sample data, UI route, and data-design notes.
- Replace manually curated timeline entries with deterministic client-side rendering from the structured source file.
- Extend the markdown viewer path policy to allow approved internal documentation roots beyond `changes/` while preserving path safety.
- Create reusable global skills for PRD authoring, design/persona journeys, JTBD/usecase mapping, persona timeline generation, and markdown-viewer runtime maintenance.

## Capabilities

### New Capabilities
- `documentation-prd-jtbd-platform`: Defines PRD-first documentation IA, structured JTBD/usecase records, and persona timeline generation behavior.
- `openspec-markdown-viewer-runtime`: Defines safe runtime markdown rendering for approved documentation roots with stable `?doc=` contract.
- `documentation-skills-pack`: Defines reusable skill templates/workflows for docs authoring and viewer maintenance.

### Modified Capabilities
- `documentation-entrypoint`: Documentation index content and link set are expanded to include PRD, design, JTBD/usecases, data design, and generated timeline behavior.

## Impact

- Documentation UI: `prototype/documents/openspec/index.html`.
- Markdown runtime viewer: `prototype/documents/openspec/viewer.html`.
- New documentation source files under `prototype/documents/openspec/docs/` and `prototype/documents/openspec/data/`.
- New OpenSpec change artifacts under `openspec/changes/documentation-prd-jtbd-skills-platform/` and mirror copy under `prototype/documents/openspec/changes/documentation-prd-jtbd-skills-platform/`.
- New global skills under `$CODEX_HOME/skills`.
