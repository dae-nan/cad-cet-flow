## ADDED Requirements

### Requirement: CAD detail information architecture SHALL prioritize strategy context before child lists
Group and Country CAD detail pages SHALL render `Summary` and `Strategy` sections before `Country CADs`/child test tables.

#### Scenario: Group CAD section order
- **WHEN** Group CAD detail renders
- **THEN** `Summary` and `Strategy` SHALL appear before `Country CADs`

#### Scenario: Country CAD section order
- **WHEN** Country CAD detail renders
- **THEN** `Summary` and `Strategy` SHALL appear before child tests

### Requirement: Country CAD list SHALL reduce redundant fields
Country CAD listing in Group detail SHALL prioritize actionable fields and avoid repeated information already encoded in Name.

#### Scenario: Reduced redundancy columns
- **WHEN** Country CAD list renders under Group detail
- **THEN** redundant geographic/product columns MAY be omitted while preserving status and child-count visibility
