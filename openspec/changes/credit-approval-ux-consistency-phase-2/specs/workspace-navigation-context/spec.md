## MODIFIED Requirements

### Requirement: Home and Inbox center cards SHALL use aligned filter/metric rhythm
The system SHALL render search, metrics, and filter controls in a consistent sequence for Home and Inbox.

#### Scenario: Home sequence
- **WHEN** Home renders
- **THEN** card content SHALL appear in order: search row, metric grid, table-filter row
- **AND** table-filter spacing SHALL remain stable across status selections

#### Scenario: Inbox sequence
- **WHEN** Inbox renders
- **THEN** card content SHALL appear in order: search row, metric grid, table-filter row
- **AND** table-filter controls SHALL be `My Inbox` and `Team Inbox`

### Requirement: Inbox scope controls SHALL be surface-appropriate
The system SHALL remove duplicate laptop scope controls in the left panel while preserving mobile scope access.

#### Scenario: Laptop inbox left panel
- **WHEN** viewport is laptop/desktop and route is Inbox
- **THEN** Inbox Scope SHALL NOT render as a separate left-panel section

#### Scenario: Mobile collapsed inbox rail
- **WHEN** viewport is mobile and left panel is collapsed on Inbox
- **THEN** scope pills `Me` and `Tm` SHALL render after document filter icons with a separator
