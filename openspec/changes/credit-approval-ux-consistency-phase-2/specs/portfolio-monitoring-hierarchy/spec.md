## MODIFIED Requirements

### Requirement: Portfolio metrics SHALL show segment exposure cards
Portfolio Monitoring SHALL replace quick-filter KPI cards with segment exposure cards.

#### Scenario: Segment card set
- **WHEN** Portfolio Monitoring header metrics render
- **THEN** cards SHALL include `Wealth`, `Retail`, and `SME Business Banking`
- **AND** each card SHALL show amount, utilization, and a mini trend chart

### Requirement: Portfolio header SHALL not use Home quick controls
Portfolio Monitoring SHALL NOT render `All Docs`, `My Docs`, or `Governance Alerts` quick-filter buttons in the header.

#### Scenario: Portfolio quick-filter removal
- **WHEN** user opens Portfolio Monitoring
- **THEN** quick controls from Home SHALL be absent
