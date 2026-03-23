# OpenSpec Documents Mirror

This folder mirrors selected OpenSpec change artifacts for easier access from the prototype workspace.

Canonical source of truth:
- `openspec/changes/` (from repository root)

Current mirrored change:
- `prototype/documents/openspec/changes/codify-prototype-flow-and-evidence/`

Notes:
- Keep canonical OpenSpec files under `openspec/changes/...` so OpenSpec CLI commands continue to work.
- Treat this mirror as documentation-facing output for product/prototype review.

## Sync Workflow

1. Update canonical files first:
   - `openspec/changes/codify-prototype-flow-and-evidence/`
2. Re-sync mirror copy:
   - `rsync -a --delete --exclude='.DS_Store' openspec/changes/codify-prototype-flow-and-evidence prototype/documents/openspec/changes/`
3. Verify parity (excluding `.DS_Store`):
   - `diff -ru --exclude='.DS_Store' openspec/changes/codify-prototype-flow-and-evidence prototype/documents/openspec/changes/codify-prototype-flow-and-evidence`
