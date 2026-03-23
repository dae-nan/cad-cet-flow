## Why

The current credit workspace prototype contains substantial interaction logic in `prototype/app.js`, but that behavior is not yet captured as normative OpenSpec requirements. We need a proposal that converts implemented behavior and logged UI evidence (screenshots/YAML/console logs) into an auditable spec baseline before further implementation work.

## What Changes

- Establish a formal spec baseline for the prototype's core interaction model: route parsing, breadcrumb/context panel behavior, and view-specific navigation.
- Specify portfolio monitoring and hierarchy table behavior, including type/status filtering and drill-down path expectations.
- Specify CET governance validation behavior, including issue categorization, submit gating, right-panel behavior, and governance rule detail modal expectations.
- Specify CET creation flow behavior from the floating action entrypoint through required fields, draft creation, and route transition.
- Introduce evidence traceability requirements so each accepted behavior is mapped to code and logged artifacts (`.playwright-cli/*.png`, `.playwright-cli/page-*.yml`, `.playwright-cli/console-*.log`).

## Capabilities

### New Capabilities
- `workspace-navigation-context`: Route-to-view mapping, breadcrumb behavior, and context/section panel expectations.
- `portfolio-monitoring-hierarchy`: Portfolio monitoring table, hierarchy explorer behavior, and filter/sort interactions.
- `cet-governance-validation`: CET validation model, issue severity handling, submission controls, and governance modal behavior.
- `cet-creation-evidence-traceability`: CET creation drawer workflow and evidence manifest requirements linking requirements to screenshots/logs.
- `documentation-entrypoint`: Help-menu documentation entrypoint behavior and prototype documentation index discoverability.

### Modified Capabilities
- None.

## Impact

- Affects product behavior documentation for `prototype/app.js` route parsing, rendering, filtering, validation, and create-drawer flows.
- Introduces new OpenSpec artifacts under `openspec/changes/codify-prototype-flow-and-evidence/specs/`.
- Establishes `.playwright-cli` artifacts as acceptance evidence inputs.
- Affects runtime UI behavior in `prototype/app.js` Help menu documentation action to open the mirrored documentation index.
