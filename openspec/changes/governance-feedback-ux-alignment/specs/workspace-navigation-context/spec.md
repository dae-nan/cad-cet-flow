## ADDED Requirements

### Requirement: Detail views SHALL expose stage and role context
The system SHALL display workflow stage and acting-role context for Group, Country, CET, and Sandbox detail routes.

#### Scenario: Stage banner visible on detail route
- **WHEN** the user opens any detail route
- **THEN** the interface SHALL show current stage label and acting role context

### Requirement: Action controls SHALL reflect stage and role eligibility
The system SHALL adapt Save and Submit controls by document stage, role, and document status.

#### Scenario: Active CAD hides Save Draft
- **WHEN** a Group or Country CAD is in `ACTIVE`
- **THEN** `Save Draft` SHALL be hidden

#### Scenario: Stage-gated submit label
- **WHEN** current stage is `DRAFT_RM`
- **THEN** submit label SHALL be `Submit to Business Proposer`

#### Scenario: Stage-gated submit label for proposer
- **WHEN** current stage is `DRAFT_BUSINESS_PROPOSER`
- **THEN** submit label SHALL be `Submit to 2nd Line`

### Requirement: Home view SHALL use simplified quick controls
The system SHALL present Home quick controls only in the top filter row and remove Home left-panel action filter duplication.

#### Scenario: Home filter row
- **WHEN** user opens Home
- **THEN** quick controls SHALL be `All Docs`, `My Docs`, and `Alerts`

### Requirement: Home metrics SHALL be document-type aware
The system SHALL render status cards according to selected Home document type plus Governance Alerts.

#### Scenario: Group/Country metric cards
- **WHEN** `homeType` is `group` or `country`
- **THEN** cards SHALL include `Active`, `Retired`, `Draft`, and `Governance Alerts`

#### Scenario: CET/Sandbox metric cards
- **WHEN** `homeType` is `cet` or `sandbox`
- **THEN** cards SHALL include `Draft`, `Inflight`, `Success`, `Failed`, and `Governance Alerts`
