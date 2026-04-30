## MODIFIED Requirements

### Requirement: Role-switched CET lifecycle SHALL support distinct 2LoD Editor and 2LoD Approver responsibilities
The workflow SHALL separate draft editing from approval decisioning in 2LoD roles, without UX redesign.

#### Scenario: 2LoD Editor edits draft
- **GIVEN** CET is in draft lifecycle state
- **WHEN** acting role switches to authorized 2LoD Editor
- **THEN** permitted draft fields SHALL be editable
- **AND** 2LoD commentary fields SHALL be saveable in draft

#### Scenario: 2LoD Approver is decision-only
- **GIVEN** CET is in submitted lifecycle state
- **WHEN** acting role is 2LoD Approver (CCH)
- **THEN** approval/reject actions SHALL be available
- **AND** draft editing controls SHALL remain unavailable

### Requirement: 1st-line resubmission SHALL preserve review trace
After 2LoD draft edits, 1st-line submit actions SHALL preserve tracked-change history and decision context.

#### Scenario: 1st-line reviews and submits
- **WHEN** acting role switches back to RM/Proposer
- **THEN** tracked changes SHALL be visible for review
- **AND** submission to 2LoD SHALL retain the change trace

### Requirement: Draft save SHALL persist locally for prototype clarification
The draft save action SHALL persist editable form fields to local storage for 1st-line and 2LoD Editor roles.

#### Scenario: 1st-line local save and reload
- **WHEN** RM or Proposer saves draft and reloads the same record
- **THEN** previously saved draft fields SHALL be restored from local storage

### Requirement: Return-for-rework SHALL enforce commentary
Return-for-rework outcomes SHALL require commentary and expose feedback on re-entry.

#### Scenario: Missing commentary blocks return
- **WHEN** 2LoD selects non-accept outcome without commentary
- **THEN** decision submission SHALL be blocked

#### Scenario: Rework stage shows prior feedback
- **WHEN** item re-enters RM/Proposer draft stage
- **THEN** prior commentary and decision context SHALL be visible
