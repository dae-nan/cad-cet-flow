## ADDED Requirements

### Requirement: CET and Sandbox workflow banners SHALL use shared timeline presentation
The system SHALL render CET and Sandbox workflow banners with the same Ant Design basic-timeline style component used in CAD detail views.

#### Scenario: CET timeline rendering style
- **WHEN** CET detail renders
- **THEN** the workflow banner timeline SHALL use shared structure and styling consistent with Group/Country forms

#### Scenario: Sandbox timeline rendering style
- **WHEN** Sandbox detail renders
- **THEN** the workflow banner timeline SHALL use shared structure and styling consistent with Group/Country/CET forms

### Requirement: CET and Sandbox timeline SHALL reflect terminal status
The system SHALL reflect `SUCCESS` and `FAILED` statuses as explicit terminal outcome states in the workflow timeline.

#### Scenario: Success terminal state
- **WHEN** CET or Sandbox status is `SUCCESS`
- **THEN** the terminal timeline item SHALL display as completed success state

#### Scenario: Failed terminal state
- **WHEN** CET or Sandbox status is `FAILED`
- **THEN** the terminal timeline item SHALL display as failed terminal state
