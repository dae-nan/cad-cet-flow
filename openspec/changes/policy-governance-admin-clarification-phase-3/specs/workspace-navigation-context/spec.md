## MODIFIED Requirements

### Requirement: Role switching SHALL synchronize Home, Inbox, and Detail state
Switching acting role SHALL immediately recalculate view data and action affordances based on stage, assignment, and authority.

#### Scenario: Top-banner switcher is the single role switch control
- **WHEN** user navigates across Home, Inbox, and detail routes
- **THEN** role switching SHALL be available from the main banner control
- **AND** no duplicate role switch control SHALL appear inside detail forms

#### Scenario: Role switch updates inbox assignments
- **WHEN** actor changes from RM to 2LoD approver
- **THEN** `My Inbox` and `Team Inbox` contents SHALL refresh to the approver context
- **AND** counters SHALL reflect approver-assigned workload

#### Scenario: Role switch updates action visibility
- **WHEN** actor changes across roles on the same record
- **THEN** submit, decision, and edit actions SHALL reflect role/stage permissions without stale controls

### Requirement: Cross-view status semantics SHALL remain consistent
Home and Inbox status buckets SHALL reflect the same workflow state classification.

#### Scenario: Returned item consistency
- **WHEN** 2LoD returns an item for rework
- **THEN** Home and Inbox SHALL both classify and surface it consistently for 1st-line remediation

### Requirement: Section ownership annotations SHALL use 1LoD/2LoD labels
Left-panel and section ownership badges SHALL represent editable ownership as 1LoD or 2LoD only.

#### Scenario: No RM label in section ownership
- **WHEN** section ownership badges render
- **THEN** labels SHALL use `1LoD` or `2LoD`
- **AND** role semantics SHALL still enforce RM vs Proposer edit boundaries within 1LoD lifecycle stages
