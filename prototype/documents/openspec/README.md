# OpenSpec Documents Mirror

This folder mirrors selected OpenSpec change artifacts for easier access from the prototype workspace.

Canonical source of truth:
- `openspec/changes/` (from repository root)

Current mirrored changes include:
- `codify-prototype-flow-and-evidence`
- `governance-feedback-ux-alignment`
- `credit-approval-ux-consistency-phase-2`
- `documentation-prd-jtbd-skills-platform`

Notes:
- Keep canonical OpenSpec files under `openspec/changes/...` so OpenSpec CLI commands continue to work.
- Treat this mirror as documentation-facing output for product/prototype review.

## Sync Workflow

1. Update canonical files first under `openspec/changes/<change-name>/`.
2. Re-sync mirror copy:
   - `rsync -a --delete --exclude='.DS_Store' openspec/changes/<change-name> prototype/documents/openspec/changes/`
3. Verify parity (excluding `.DS_Store`):
   - `diff -ru --exclude='.DS_Store' openspec/changes/<change-name> prototype/documents/openspec/changes/<change-name>`
