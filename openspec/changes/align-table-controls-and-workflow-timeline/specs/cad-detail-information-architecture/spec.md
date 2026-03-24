## ADDED Requirements

### Requirement: Workflow banner SHALL use shared timeline presentation in CAD detail forms
The system SHALL render Group and Country workflow banners using a shared Ant Design basic-timeline style component driven by workflow stage state.

#### Scenario: Group CAD timeline rendering
- **WHEN** Group CAD detail renders
- **THEN** the workflow banner SHALL show Draft, Proposing, Approving, and Active stages with done/current/pending styling

#### Scenario: Country CAD timeline rendering
- **WHEN** Country CAD detail renders
- **THEN** the workflow banner SHALL show Draft, Proposing, Approving, and Active stages with done/current/pending styling

### Requirement: Detail forms SHALL flex with center-panel width changes
The system SHALL keep workflow and form cards responsive under left-panel expanded/collapsed layouts and mobile breakpoints.

#### Scenario: Left panel collapse reflow
- **WHEN** the left panel is toggled between expanded and collapsed
- **THEN** detail form controls and timeline content SHALL reflow without clipping or horizontal overflow

#### Scenario: Mobile detail consistency
- **WHEN** detail views render on mobile widths
- **THEN** timeline and form fields SHALL stack consistently without overlap
