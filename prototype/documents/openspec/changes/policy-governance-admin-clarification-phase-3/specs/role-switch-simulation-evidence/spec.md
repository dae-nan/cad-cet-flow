## ADDED Requirements

### Requirement: Role-switch workflow SHALL be demonstrated via Playwright evidence
The system SHALL provide automated evidence of multi-role CET workflow using role switcher interactions.

#### Scenario: Happy-path demo across roles
- **GIVEN** a CET draft under Country CAD scope
- **WHEN** Playwright executes RM/Proposer create, 2LoD draft edit, 1st-line submit, and 2LoD approve
- **THEN** evidence SHALL include successful step assertions and captured artifacts

#### Scenario: Send-back path demo across roles
- **WHEN** Playwright executes non-accept decision with commentary and return-for-rework
- **THEN** evidence SHALL show rework visibility and commentary persistence for 1st line

### Requirement: Negative authorization scenarios SHALL be demonstrated
Playwright evidence SHALL include unauthorized approval and mandatory-commentary enforcement cases.

#### Scenario: Unauthorized 2LoD approval blocked
- **WHEN** approver lacks country authority
- **THEN** approval action SHALL be blocked and assertion SHALL pass

#### Scenario: Missing commentary blocked
- **WHEN** non-accept outcome is submitted without required commentary
- **THEN** submission SHALL be blocked and assertion SHALL pass

### Requirement: Evidence manifest SHALL index role-based demo outputs
Evidence manifest SHALL reference traces/screenshots/logs for each role-switched scenario.

#### Scenario: Evidence completeness
- **WHEN** change is ready for review
- **THEN** evidence manifest SHALL include artifact references for RM/Proposer/Approver/Global role paths
