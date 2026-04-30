## 1. OpenSpec Artifacts (Primary)

- [x] 1.1 Finalize `proposal.md` and `design.md` for clarification scope (no UX redesign).
- [x] 1.2 Update capability specs for policy, authority, lifecycle, navigation sync, and docs sync.
- [x] 1.3 Add new capability spec for role-switch simulation evidence.
- [x] 1.4 Ensure all requirements include ideal and edge acceptance criteria with sample data.

## 2. Acceptance Criteria Reinforcement (Existing Behavior)

- [x] 2.1 Reinforce existing workflow-state criteria (RM -> Proposer -> 2LoD) without changing UX.
- [x] 2.2 Reinforce 2LoD decisioning criteria (`Accept`, `Accept with caveats`, `Reject`) and commentary requirements.
- [x] 2.3 Reinforce existing navigation/table interaction criteria where behavior already exists.

## 3. Policy and Authority Clarifications

- [x] 3.1 Add booking-volume comparator requirements with USD normalization, inclusive boundary, and country overrides.
- [x] 3.2 Add Global Head read-only requirements and delegated edit-grant criteria.
- [x] 3.3 Add unauthorized authority negative scenarios for country-mismatched approvers.

## 4. Role-Switched Journey Sync

- [x] 4.1 Add role-switch journey scenarios spanning draft edit, submit, approve, and return-for-rework.
- [x] 4.2 Add Home/Inbox/Detail sync requirements so role switches immediately reflect stage and authority state.
- [x] 4.3 Add tracked-change persistence requirements for 2LoD draft edits.
- [x] 4.4 Move role switcher to top banner and remove detail-form role switcher.
- [x] 4.5 Add separate 2LoD Editor role and CCH Approver role behavior gates.
- [x] 4.6 Add 1st-line and 2LoD Editor local-storage draft save behavior.

## 5. Documentation and PRD Sync

- [x] 5.1 Add requirement that PRD and in-app documentation feature are updated with capability/AC deltas.
- [x] 5.2 Add documentation-link integrity criteria for updated capabilities.
- [x] 5.3 Add evidence checklist for documentation sync completion.

## 6. Playwright Evidence and Demo

- [x] 6.1 Define Playwright happy-path role-switch scenario as acceptance evidence.
- [x] 6.2 Capture updated Playwright happy-path evidence for `RM -> Proposer -> CCH Approver` with top-banner role switcher.
- [x] 6.3 Capture updated Playwright evidence for `2LoD Editor` draft save/comment flow.
- [x] 6.4 Capture negative evidence (unauthorized approval, missing mandatory commentary).
- [x] 6.5 Update evidence-manifest references to refreshed artifact set for this phase.
