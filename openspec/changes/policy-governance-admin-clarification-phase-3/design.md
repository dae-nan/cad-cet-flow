## Context

This prototype is used for requirement clarification. Specs are the primary artifacts; code-level behavior already present should be validated and tightened through acceptance criteria updates instead of UX churn.

## Key Decisions

1. Booking-volume rule defaults for T13:
   - Normalize to `USD` at CET creation time.
   - Comparator: `bookingVolumeUSD <= thresholdUSD`.
   - Inclusive boundary (`<=`).
   - Global default threshold: `10,000,000 USD`.
   - Country overrides (mock): `IN=8,000,000`, `SG=12,000,000`, `ID=6,000,000`.
2. T18 launch export format: `PDF` only.
3. Global Heads: read-only across countries; edit via explicit delegated grants only.
4. Role-switched journeys must keep Home/Inbox/Detail state synchronized by workflow stage and authority.
5. Keep same UX; strengthen behavior and acceptance criteria.

## Journey Clarification (Role-Switched)

1. RM/Proposer creates CET draft under Country CAD scope.
2. 2nd-line approver can edit draft fields in controlled mode with tracked changes.
3. RM/Proposer reviews tracked changes and submits to 2LoD.
4. Authorized 2LoD approves or returns with commentary.
5. Role-switched inboxes and counters reflect current stage/assignment/authority immediately.

## Data and Policy Notes

- Threshold evaluation trace should capture `rawVolume`, `normalizedUSD`, `fxRateId`, `thresholdApplied`, `overrideSource`.
- Delegated grant record should capture `grantor`, `grantee`, `scope`, `expiry`, `reason`, `revokedAt`.
- Track-changes record should capture `field`, `oldValue`, `newValue`, `actor`, `timestamp`, `reason`.

## Documentation Sync Contract

Any capability or acceptance-criteria change in this change set must be mirrored in the app documentation feature and PRD references in the same branch.
