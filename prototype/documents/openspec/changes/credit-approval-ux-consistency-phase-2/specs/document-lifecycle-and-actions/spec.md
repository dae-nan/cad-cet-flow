## MODIFIED Requirements

### Requirement: CAD lifecycle SHALL include proposer and approver queue states
Group/Country CADs SHALL support explicit status states for proposer and approver queues.

#### Scenario: CAD status set
- **WHEN** Group or Country CAD status is evaluated for filters/cards/tables
- **THEN** the status set SHALL include `DRAFT`, `PROPOSING`, `APPROVING`, `ACTIVE`, `RETIRED`
- **AND** ordering SHALL be `DRAFT -> PROPOSING -> APPROVING -> ACTIVE -> RETIRED`

#### Scenario: RM submit transition
- **WHEN** RM submits a CAD in draft/rework RM stage
- **THEN** workflow stage SHALL move to proposer review
- **AND** CAD status SHALL become `PROPOSING`

#### Scenario: Proposer submit transition
- **WHEN** Proposer submits a CAD in proposer/rework proposer stage
- **THEN** workflow stage SHALL move to 2nd-line queue
- **AND** CAD status SHALL become `APPROVING`
