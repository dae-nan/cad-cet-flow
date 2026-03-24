## ADDED Requirements

### Requirement: Role model SHALL separate proposer, approver, and governance administration
The system SHALL distinguish 1st-line RM, Business Proposer, 2nd-line Approver, and Governance Admin responsibilities.

#### Scenario: Governance role cannot initiate by default
- **WHEN** acting role is Governance Admin
- **THEN** create flows SHALL be blocked unless explicitly overridden by policy

### Requirement: Initiation rights SHALL be restricted to 1st-line roles
Only 1st-line roles SHALL be able to initiate CAD/CET/Sandbox creation actions.

#### Scenario: 2nd line create attempt blocked
- **WHEN** acting role is 2nd line approver
- **THEN** create actions SHALL be denied

### Requirement: Section edit rights SHALL be stage- and role-aware
The system SHALL allow edit access only to sections assigned to the active role for the current stage.

#### Scenario: Draft RM stage edit boundary
- **WHEN** stage is `DRAFT_RM`
- **THEN** RM-owned sections SHALL be editable and non-RM business sections SHALL be restricted

#### Scenario: Submitted stage business lock
- **WHEN** stage is `SUBMITTED_2LOD`
- **THEN** business sections SHALL be locked and 2nd-line sections/commentary SHALL remain editable to approvers
