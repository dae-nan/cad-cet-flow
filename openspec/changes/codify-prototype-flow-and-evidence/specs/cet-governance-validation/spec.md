## ADDED Requirements

### Requirement: CET validation SHALL produce categorized issue summaries
The system SHALL evaluate CET content and governance limits, producing issue summaries categorized as Blocker, Field, and Warning.

#### Scenario: Validation with failing checks
- **WHEN** CET validation identifies field completeness errors or governance breaches
- **THEN** the issue store SHALL include categorized items and non-zero summary counts

#### Scenario: Validation with no issues
- **WHEN** CET validation finds no failing checks
- **THEN** issue summary totals SHALL be zero and the panel resolution banner behavior SHALL be triggered

### Requirement: Submission controls SHALL be gated by unresolved issues
The system SHALL prevent submission when unresolved issues exist.

#### Scenario: Issues present
- **WHEN** total issue count is greater than zero
- **THEN** the Submit action SHALL be disabled

#### Scenario: Issues resolved
- **WHEN** total issue count becomes zero
- **THEN** the Submit action SHALL be enabled

### Requirement: Governance issue detail SHALL provide remediation context
The system SHALL expose governance rule details and remediation actions for issues that include governance metadata.

#### Scenario: Open governance modal
- **WHEN** the user requests rule detail for a governance issue
- **THEN** the modal SHALL display rule id, severity, boundary type, threshold, actual, delta, and mitigation checklist

#### Scenario: Jump from issue to section
- **WHEN** the user selects a "Go to field/rule" action
- **THEN** the interface SHALL scroll/focus to the linked section or field target

### Requirement: Right-panel visibility SHALL adapt to context
The issue panel SHALL auto-hide on heavy CET sections and restore visibility when context changes away from those sections.

#### Scenario: Heavy section auto-hide
- **WHEN** the active CET section is financial or risk and unresolved issues exist
- **THEN** the right issue panel SHALL auto-hide

#### Scenario: Context return and reopen
- **WHEN** the user navigates away from heavy sections and unresolved issues remain
- **THEN** the issue panel SHALL become available for reopening and active display
