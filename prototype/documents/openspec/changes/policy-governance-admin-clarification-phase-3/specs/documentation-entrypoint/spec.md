## MODIFIED Requirements

### Requirement: PRD and in-app documentation SHALL be updated with capability deltas
Any accepted capability or acceptance-criteria update in this change SHALL be reflected in PRD and in-app documentation artifacts.

#### Scenario: Capability update requires documentation sync
- **WHEN** a capability spec in this change is modified
- **THEN** corresponding PRD/documentation sections SHALL be updated in the same branch

### Requirement: Documentation links SHALL preserve traceability
Documentation entries SHALL link to current OpenSpec capabilities and acceptance scenarios.

#### Scenario: Documentation link integrity
- **WHEN** user opens documentation for this change
- **THEN** links to proposal/design/tasks/specs SHALL resolve without broken references
