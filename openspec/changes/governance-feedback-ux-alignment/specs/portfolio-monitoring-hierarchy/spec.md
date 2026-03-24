## ADDED Requirements

### Requirement: List views SHALL use explicit role ownership columns
The system SHALL represent ownership with `RM`, `Business Proposer`, and `Approver` fields instead of a single ambiguous owner label in key list tables.

#### Scenario: Home and Inbox table ownership columns
- **WHEN** Home or Inbox table renders rows
- **THEN** each row SHALL display explicit RM, Business Proposer, and Approver values

### Requirement: Record names SHALL be primary navigation links
The system SHALL make record names clickable for opening detail routes where separate Open actions existed.

#### Scenario: Name click opens detail
- **WHEN** a user clicks row Name
- **THEN** the system SHALL route to the matching detail page

### Requirement: KPI tags SHALL be aligned across list views
The system SHALL use consistent KPI tag labels under search on Home, Inbox, and Portfolio list surfaces.

#### Scenario: Consistent KPI label set
- **WHEN** user compares list views
- **THEN** Home quick-view labels SHALL be `All Docs`, `My Docs`, and `Alerts`

### Requirement: Tables SHALL default to Name ascending sort
The system SHALL initialize list/detail tables in ascending Name order and show sort state metadata.

#### Scenario: Initial table render
- **WHEN** a table first renders
- **THEN** rows SHALL be sorted by Name ascending
- **AND** sort metadata SHALL indicate active ascending sort

### Requirement: Participant model SHALL use `approver` key
The system SHALL use `participants.approver` as canonical key while reading legacy `participants.secondLineApprover`.

#### Scenario: Backward-compatible participant read
- **WHEN** a row has only `participants.secondLineApprover`
- **THEN** the Approver cell SHALL still render the participant name
- **AND** new writes SHALL persist `participants.approver`
