## MODIFIED Requirements

### Requirement: Global Head access SHALL be read-only by default
Global Head roles SHALL have cross-country read access without default edit authority.

#### Scenario: Global Head views cross-country records
- **WHEN** acting role is Global Head
- **THEN** records across countries SHALL be viewable
- **AND** edit actions SHALL be disabled by default

### Requirement: Cross-country edit rights SHALL require explicit delegated grants
Edit authority for Global Heads SHALL only be enabled through an explicit delegated grant.

#### Scenario: Delegated grant enables scoped edit
- **GIVEN** grant exists with valid `scope`, `expiry`, and `reason`
- **WHEN** Global Head opens a scoped record
- **THEN** edit controls SHALL be enabled only within granted scope

#### Scenario: Expired or revoked grant blocks edit
- **GIVEN** grant is expired or revoked
- **WHEN** Global Head attempts edit
- **THEN** edit action SHALL be denied with authority message

### Requirement: Country authority SHALL gate 2LoD approvals
2LoD approval actions SHALL require authority over the Country CAD in context.

#### Scenario: Unauthorized country approver blocked
- **GIVEN** approver scope is `SG`
- **AND** target Country CAD is `IN`
- **WHEN** approver attempts approve/reject decision
- **THEN** the action SHALL be blocked as unauthorized

### Requirement: 2LoD Editor and 2LoD Approver SHALL be separate personas
The system SHALL model separate 2LoD editor and approver personas for workflow control.

#### Scenario: Editor cannot finalize approval
- **WHEN** acting role is 2LoD Editor
- **THEN** approve/reject decision controls SHALL not be available

#### Scenario: Approver cannot perform draft-only editor saves
- **WHEN** acting role is 2LoD Approver
- **THEN** draft save/edit controls for 2LoD editor workbench SHALL be unavailable outside submission decision flow
