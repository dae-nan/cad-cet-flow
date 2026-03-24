## ADDED Requirements

### Requirement: Workflow lifecycle SHALL enforce sequential submissions
The workflow SHALL enforce RM submission to Business Proposer before Business Proposer submission to 2nd line.

#### Scenario: RM submit transition
- **WHEN** stage is `DRAFT_RM` and RM submits
- **THEN** stage SHALL transition to `DRAFT_BUSINESS_PROPOSER`

#### Scenario: Business proposer submit transition
- **WHEN** stage is `DRAFT_BUSINESS_PROPOSER` and Business Proposer submits
- **THEN** stage SHALL transition to `SUBMITTED_2LOD`

### Requirement: Decision outcomes SHALL drive lifecycle state updates
2nd-line outcomes SHALL update workflow state and review traceability.

#### Scenario: Accept outcome
- **WHEN** 2nd line submits `Accept`
- **THEN** stage SHALL transition to accepted and status SHALL reflect completion

#### Scenario: Caveat or reject outcome
- **WHEN** 2nd line submits caveat/reject with required comments
- **THEN** stage SHALL transition to returned-for-rework state and preserve commentary
