## ADDED Requirements

### Requirement: CET creation drawer SHALL enforce required context fields
The system SHALL require parent country CAD, at least one product, at least one client segment, CET name, rationale, and start/end dates before draft creation.

#### Scenario: Missing required fields
- **WHEN** a user submits step-1 creation with any required field missing
- **THEN** the drawer SHALL show validation errors and SHALL NOT create a CET draft

#### Scenario: Valid required fields
- **WHEN** a user submits step-1 creation with all required fields present
- **THEN** the system SHALL create a CET draft record and route to the new CET detail view

### Requirement: New CET drafts SHALL inherit parent context
The system SHALL initialize newly created CET drafts with parent hierarchy linkage and default governance/financial structures derived from the selected parent country CAD.

#### Scenario: Draft derivation from parent country CAD
- **WHEN** a new CET is created from a selected parent country CAD
- **THEN** the draft SHALL include group and country lineage, owner context, default limits, and default section/financial scaffolding

### Requirement: Evidence manifest SHALL map accepted scenarios to artifacts
The change SHALL include an evidence manifest that links scenarios to source logic and captured artifacts from `.playwright-cli`.

#### Scenario: Scenario-to-artifact trace entry
- **WHEN** a requirement scenario is marked as baseline-accepted
- **THEN** there SHALL be at least one manifest entry containing scenario id, route/view context, source file reference, and artifact path(s)

#### Scenario: Console quality signal capture
- **WHEN** console logs are available for captured flows
- **THEN** the manifest SHALL record console findings and classify whether they are functional blockers or accepted non-blocking noise

### Requirement: Evidence references SHALL remain reviewable over time
The evidence manifest SHALL use stable timestamped references and concise annotations so reviewers can confirm behavior without rerunning flows immediately.

#### Scenario: Reviewer audits baseline behavior
- **WHEN** a reviewer inspects the change artifacts
- **THEN** they SHALL be able to identify which screenshot/YAML/log files substantiate each major workflow requirement
