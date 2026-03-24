## ADDED Requirements

### Requirement: Help documentation index SHALL provide PRD-first IA sections
The documentation index SHALL expose primary navigation entries for `Master PRD`, `Design Document`, `JTBD & Usecases`, `Data Design`, and `Feature Timeline by Persona`.

#### Scenario: User opens Help > Documentation
- **WHEN** the user opens documentation from the Help menu
- **THEN** the system SHALL render the five primary sections in the index
- **AND** each section SHALL link to corresponding markdown or generated timeline content

### Requirement: Documentation platform SHALL use a structured JTBD/usecase source
The system SHALL read timeline/journey content from a structured source file that includes persona metadata, JTBD dimensions, and scenario-level traceability fields.

#### Scenario: Source includes a usecase record
- **WHEN** a usecase record is present in the structured source
- **THEN** it SHALL include persona identifier, functional/emotional/social jobs, trigger, outcome, linked OpenSpec spec, ideal scenario, edge cases, sample data, UI route (where applicable), and data-design notes

### Requirement: Feature Timeline by Persona SHALL be generated from source data
The timeline UI SHALL be rendered from the structured source rather than hard-coded timeline HTML entries.

#### Scenario: Persona filter is selected
- **WHEN** a persona filter is selected
- **THEN** the timeline SHALL show only generated items tagged to that persona
- **AND** each item SHALL preserve linkability to related OpenSpec/usecase records
