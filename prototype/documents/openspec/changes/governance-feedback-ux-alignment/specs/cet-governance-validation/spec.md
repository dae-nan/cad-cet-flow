## ADDED Requirements

### Requirement: 2nd-line decisioning SHALL support three outcomes
The system SHALL support `Accept`, `Accept with caveats`, and `Reject` outcomes for submitted CET/Sandbox approvals.

#### Scenario: Decision options shown for 2nd line
- **WHEN** stage is `SUBMITTED_2LOD` and acting role is 2nd line approver
- **THEN** the decision panel SHALL show all three outcomes

### Requirement: Caveat and reject outcomes SHALL require comments
The system SHALL require section-level and/or end commentary when decision outcome is `Accept with caveats` or `Reject`.

#### Scenario: Missing comment blocks caveat/reject
- **WHEN** 2nd line selects caveat or reject without section/end comments
- **THEN** the system SHALL block decision submission

### Requirement: Decision feedback SHALL persist for rework
The system SHALL persist section comments and end commentary and surface them when items return for rework.

#### Scenario: Rework shows prior feedback
- **WHEN** a caveated/rejected item is returned to draft sub-state
- **THEN** the interface SHALL show saved section/end commentary for remediation

### Requirement: Guidance blocks SHALL expose explicit affordance
The system SHALL display an explicit expand/collapse indicator for guidance sections.

#### Scenario: Guidance summary shows chevron
- **WHEN** guidance blocks render
- **THEN** summary headers SHALL include visible expand/collapse arrow indicators

### Requirement: Create CET drawer SHALL enforce contextual IA
The system SHALL structure Create CET fields into context-aware sections and dynamically scope options.

#### Scenario: Parent context controls product/segment options
- **WHEN** no parent Country CAD is selected
- **THEN** Product and Client Segment selectors SHALL remain disabled/empty
- **AND WHEN** parent Country CAD is selected
- **THEN** Product and Client Segment options SHALL be populated from selected lineage context

### Requirement: Create CET warnings SHALL be non-blocking
The system SHALL show informational warnings for non-future dates and duplicate parameter combinations without blocking creation.

#### Scenario: Soft warning for start date
- **WHEN** proposed start date is today or earlier
- **THEN** the UI SHALL show a soft warning and allow user to continue

#### Scenario: Soft duplicate warning
- **WHEN** same `countryCadId + product set + client segment set` already exists
- **THEN** the UI SHALL show a soft duplicate warning and allow user to continue
