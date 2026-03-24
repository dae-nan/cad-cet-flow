## ADDED Requirements

### Requirement: Help documentation action SHALL open the OpenSpec docs index
The system SHALL open the prototype documentation index when users select Documentation from the Help FAB menu.

#### Scenario: Documentation action opens docs index
- **WHEN** the user clicks Help FAB and selects `Documentation`
- **THEN** the system SHALL open `documents/openspec/index.html` in a new browser tab/window

### Requirement: Non-documentation Help actions SHALL preserve existing behavior
The system SHALL keep existing placeholder behavior unchanged for Help actions other than Documentation.

#### Scenario: Other Help actions remain unchanged
- **WHEN** the user selects `Find Your Approver`, `Demo Mode`, or `Contact Credit Chat`
- **THEN** the system SHALL keep existing placeholder responses and SHALL NOT redirect to documentation

### Requirement: Documentation index SHALL expose change artifacts and capability specs
The documentation index SHALL provide direct access to key artifacts and capability specifications for the active OpenSpec change.

#### Scenario: Docs index link set is complete
- **WHEN** the docs index is opened
- **THEN** users SHALL be able to access `proposal`, `design`, `tasks`, `evidence manifest`, and each capability `spec.md` from that page
