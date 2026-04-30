## MODIFIED Requirements

### Requirement: CET threshold eligibility SHALL use normalized USD comparator
The system SHALL evaluate CET creation eligibility using normalized USD booking volume with an inclusive threshold comparator.

#### Scenario: Threshold pass under country override
- **GIVEN** Country is `IN` with override threshold `8,000,000 USD`
- **AND** booking volume normalized is `7,900,000 USD`
- **WHEN** CET eligibility is evaluated
- **THEN** comparator `bookingVolumeUSD <= thresholdUSD` SHALL pass
- **AND** the flow SHALL allow CET creation

#### Scenario: Threshold boundary equality
- **GIVEN** Country is `SG` with override threshold `12,000,000 USD`
- **AND** booking volume normalized is `12,000,000 USD`
- **WHEN** CET eligibility is evaluated
- **THEN** eligibility SHALL pass because boundary is inclusive

#### Scenario: Threshold fail triggers restriction or dispensation path
- **GIVEN** Country is `ID` with override threshold `6,000,000 USD`
- **AND** booking volume normalized is `6,200,000 USD`
- **WHEN** CET eligibility is evaluated
- **THEN** direct CET creation SHALL be blocked
- **AND** restrict/dispensation path SHALL be presented

### Requirement: Threshold evaluation SHALL be auditable
The system SHALL record threshold evaluation inputs and outputs for each CET decision.

#### Scenario: Evaluation trace capture
- **WHEN** eligibility is evaluated
- **THEN** the system SHALL persist `rawVolume`, `normalizedUSD`, `fxRateId`, `thresholdApplied`, and `overrideSource`

### Requirement: Existing CET conflict checks SHALL remain enforced
The system SHALL continue to check for ongoing CET conflicts before allowing new CET creation.

#### Scenario: Ongoing CET blocks duplicate-risk creation
- **GIVEN** an ongoing CET exists for the same parent CAD and parameter set
- **WHEN** a new CET is initiated
- **THEN** the system SHALL block creation and show conflict rationale
