## MODIFIED Requirements

### Requirement: Key list/detail tables SHALL place status as terminal context
The system SHALL place `Status` as the last table column in key Home/Inbox/detail list tables.

#### Scenario: Status terminal column
- **WHEN** Home, Inbox, Group detail child table, or Country detail child table renders
- **THEN** `Status` SHALL appear after ownership columns (`RM`, `Proposer`, `Approver`)

### Requirement: Ownership labels SHALL use concise role naming
The system SHALL use concise ownership labels while preserving full-name discoverability.

#### Scenario: Ownership label set
- **WHEN** ownership columns render in key tables
- **THEN** labels SHALL be `RM`, `Proposer`, and `Approver`
- **AND** full names SHALL remain accessible via hover/title where visible
