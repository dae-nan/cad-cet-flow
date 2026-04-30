## Why

Policy & Governance admins provided additional requirement-clarification feedback that must be codified as primary OpenSpec artifacts before further prototype iteration. The current prototype already implements substantial workflow and UX behavior, but acceptance criteria and authority boundaries need reinforcement and synchronization across role-switched journeys.

This change formalizes clarified policy defaults, role authority semantics, role-switched inbox/state expectations, and PRD/documentation sync obligations while preserving existing UX patterns.

## What Changes

- Reinforce (not redesign) acceptance criteria for existing workflow and decision capabilities.
- Codify booking-volume comparator defaults and country overrides for branch-level testing.
- Codify Global Head access as read-only with explicit delegated edit grants.
- Add explicit role-switch simulation requirements across RM/Proposer/Approver/Governance Admin views.
- Add cross-view sync requirements so Home/Inbox/Detail states remain consistent after transitions and role switches.
- Add documentation sync requirements so PRD, OpenSpec capabilities, and in-app documentation stay aligned.
- Add Playwright demonstration evidence requirements as part of acceptance.

## Non-Goals

- No new UX direction, layout, or visual redesign.
- No replacement of prior OpenSpec changes; this change clarifies and tightens acceptance criteria.
- No production policy-value finalization beyond approved mock defaults for branch test.

## Capabilities

### New Capabilities
- `role-switch-simulation-evidence`

### Modified Capabilities
- `cet-governance-validation`
- `role-based-access-governance`
- `document-lifecycle-and-actions`
- `workspace-navigation-context`
- `documentation-entrypoint`

## Impact

- OpenSpec-first refinement for implementation and test planning.
- Prototype behavior should remain visually consistent; updates focus on policy gates, authority handling, and acceptance verification.
- Test evidence scope expands to include role-switched Playwright demos and documentation-sync checks.
