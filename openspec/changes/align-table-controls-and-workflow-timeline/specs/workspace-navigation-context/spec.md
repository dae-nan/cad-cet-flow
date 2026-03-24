## ADDED Requirements

### Requirement: List views SHALL place table controls inside table cards
The system SHALL render search and table-filter control rows inside the list table card for Home, Inbox, and Portfolio, above table header controls.

#### Scenario: Home table controls location
- **WHEN** Home view renders
- **THEN** search and quick filter controls SHALL appear inside the selected-view table card before the panel header

#### Scenario: Inbox table controls location
- **WHEN** Inbox view renders
- **THEN** search and scope filter controls SHALL appear inside the inbox table card before the panel header

#### Scenario: Portfolio table controls location
- **WHEN** Portfolio view renders
- **THEN** search and table filter controls SHALL appear inside the portfolio table card before the panel header

### Requirement: List first card SHALL include a static view subheading
The system SHALL render a concise, static one-line subheading in the first card for Home, Inbox, and Portfolio above the metrics row.

#### Scenario: Home subheading placement
- **WHEN** Home view first card renders
- **THEN** a static one-line helper text SHALL appear between the title and metrics row

#### Scenario: Inbox and Portfolio subheading placement
- **WHEN** Inbox or Portfolio first card renders
- **THEN** a static one-line helper text SHALL appear between the title and metrics row
