## ADDED Requirements

### Requirement: Route parsing SHALL resolve canonical workspace views
The system SHALL map hash routes to canonical views for Home, Inbox, Portfolio, Group CAD detail, Country CAD detail, CET detail, and Sandbox detail.

#### Scenario: Home route fallback
- **WHEN** the hash is empty, invalid, or does not match a known pattern
- **THEN** the system SHALL resolve to the Home view

#### Scenario: CAD route depth mapping
- **WHEN** the hash route matches `#/cad/<groupCadId>/<country>/<countryCadId>/<childId>`
- **THEN** the system SHALL resolve the view as CET unless `childId` starts with `SBX-`, in which case it SHALL resolve as Sandbox

### Requirement: Breadcrumb and context panels SHALL match resolved route
The system SHALL render breadcrumb links and context trace elements that reflect the currently resolved route and support parent-level navigation.

#### Scenario: Detail route breadcrumb context
- **WHEN** the resolved route is a Group/Country/CET/Sandbox detail view
- **THEN** breadcrumb and trace links SHALL include Home and each available ancestor path in order

#### Scenario: List route breadcrumb context
- **WHEN** the resolved route is Home, Inbox, or Portfolio
- **THEN** breadcrumb SHALL display only the corresponding top-level navigation path

### Requirement: Left panel mode SHALL adapt by route class
The left panel SHALL provide quick-view and filter controls on top-level views and section/trace controls on detail views.

#### Scenario: Top-level view controls
- **WHEN** the user is on Home, Inbox, or Portfolio
- **THEN** the left panel SHALL expose view-appropriate quick filters and navigation controls

#### Scenario: Detail view controls
- **WHEN** the user is on Group/Country/CET/Sandbox detail
- **THEN** the left panel SHALL expose trace and section navigation controls aligned to the active document type
