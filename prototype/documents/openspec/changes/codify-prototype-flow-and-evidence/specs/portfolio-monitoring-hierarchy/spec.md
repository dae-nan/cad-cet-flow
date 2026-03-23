## ADDED Requirements

### Requirement: Portfolio monitoring SHALL support hierarchical document aggregation
The system SHALL aggregate Group CAD, Country CAD, CET, and Sandbox records into a hierarchical monitoring table with drill-down capability.

#### Scenario: All-type portfolio view
- **WHEN** the Portfolio type filter is set to `all`
- **THEN** the hierarchy SHALL expose Group and Country rows by default and SHALL make CET and Sandbox rows available through hierarchy expansion

#### Scenario: Type-constrained portfolio view
- **WHEN** the Portfolio type filter is set to one specific type
- **THEN** the table SHALL include only records of that type while preserving valid navigation actions

### Requirement: Portfolio status and data filters SHALL be consistently applied
The system SHALL apply status, search term, and attribute filters (product, segment, cluster, country, my-doc scope) consistently before rendering portfolio rows.

#### Scenario: Governance alerts quick filter
- **WHEN** the governance-alerts quick view is active
- **THEN** only rows meeting governance-alert threshold criteria SHALL be shown

#### Scenario: Search across key row attributes
- **WHEN** the user enters a search term
- **THEN** the rendered rows SHALL be filtered by a combined searchable text over key row attributes such as id, name, owner, country, product, and segment

### Requirement: Hierarchy controls SHALL preserve drill-down continuity
The system SHALL maintain hierarchy expansion behavior and route continuity when users switch filters, sort columns, and open child records.

#### Scenario: Expand and drill into a child
- **WHEN** a user expands hierarchy rows and opens a child record
- **THEN** the system SHALL navigate to that record's detail route while preserving valid ancestor context

#### Scenario: Sort and optional column behavior
- **WHEN** users change sort order or optional column visibility in Portfolio
- **THEN** sorting and visible columns SHALL update deterministically without breaking row action navigation
