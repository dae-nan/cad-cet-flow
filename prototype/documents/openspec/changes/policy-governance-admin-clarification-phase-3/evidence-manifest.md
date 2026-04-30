# Evidence Manifest

This manifest tracks role-switched workflow and documentation-sync evidence for `policy-governance-admin-clarification-phase-3`.

## Planned Artifact Index

| Evidence ID | Scenario | Planned Artifact | Status | Notes |
|---|---|---|---|---|
| PGC4-012 | Completed RM to Proposer transition | `.playwright-cli/pgc4-finalpass-rm-to-proposer.png` | Captured | Deterministic test-ready path shows stage change from 1st-line draft to Proposer review. |
| PGC4-013 | Completed Proposer to Submitted 2LoD transition | `.playwright-cli/pgc4-finalpass-proposer-to-submitted2lod.png` | Captured | Shows Proposer submit advances to submitted 2LoD approver stage. |
| PGC4-014 | Completed CCH decision panel availability | `.playwright-cli/pgc4-finalpass-cch-panel.png` | Captured | Confirms approver role sees decision panel in submitted stage. |
| PGC4-015 | Completed missing commentary block with decision action present | `.playwright-cli/pgc4-finalpass-missing-commentary-blocked.png` | Captured | Confirms submit action present, alert shown, and stage unchanged when commentary is missing. |
| PGC4-016 | Top-banner role-switch UX and split-role visuals | `.playwright-cli/pgc4-topbar-role-switcher.png`, `.playwright-cli/pgc4-2lod-editor-view.png`, `.playwright-cli/pgc4-cch-inbox-view.png` | Captured | Confirms global role-switch UX and role-specific context views. |
| PGC4-017 | Local draft persistence proof (session-level) | `.playwright-cli/pgc4-localstorage-proof.png` | Captured | Confirms localStorage key + value restoration in active flow. |

## Documentation Sync Checklist

- [x] Change package mirrored to `prototype/documents/openspec/changes/policy-governance-admin-clarification-phase-3/`.
- [x] Docs index includes links to new change package.
- [x] PRD baseline list references this change package.
- [x] Playwright role demo artifacts captured and linked.
- [x] Console findings logged for the demo run.

## Console Findings

- `.playwright-cli/console-2026-04-29T12-45-12-794Z.log`
- `.playwright-cli/console-2026-04-29T12-49-57-146Z.log`
- `.playwright-cli/console-2026-04-29T12-50-10-036Z.log`
- `.playwright-cli/console-2026-04-29T12-50-25-461Z.log`
- `.playwright-cli/console-2026-04-29T13-41-57-057Z.log`
- `.playwright-cli/console-2026-04-29T13-42-02-359Z.log`
- `.playwright-cli/console-2026-04-29T14-04-05-939Z.log`
- `.playwright-cli/console-2026-04-29T14-26-51-955Z.log`
- `.playwright-cli/console-2026-04-30T01-25-28-474Z.log`
- `.playwright-cli/console-2026-04-30T01-47-33-459Z.log`
- Observed errors: favicon/asset errors only in this prototype run.

## Superseded Artifacts

- `pgc3-*` artifacts: initial baseline role-switch and docs captures.
- `pgc4-strict-*` and `pgc4-complete*`: exploratory/attempt runs retained for trace history.
- Canonical acceptance set for this slice is `pgc4-finalpass-*` plus `pgc4-localstorage-proof.png` and `pgc4-topbar-role-switcher.png`/`pgc4-2lod-editor-view.png`/`pgc4-cch-inbox-view.png`.
