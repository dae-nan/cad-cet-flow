## Why

List and detail experiences in the prototype currently place table controls and workflow progress in inconsistent locations and styles. This causes extra scanning effort, unclear stage context for forms, and layout instability when panel widths change.

## What Changes

- Move search/filter control rows into the list table cards for Home, Inbox, and Portfolio, above table header controls.
- Add a concise static one-line subheading in the first card of Home, Inbox, and Portfolio above the metrics row.
- Replace custom workflow `<ol>` pills with a shared Ant Design basic-timeline style workflow component in Group, Country, CET, and Sandbox workflow banners.
- Make detail forms and workflow cards flex with available center-panel width, including left-panel expanded/collapsed states and mobile breakpoints.
- Keep existing role simulation, decision panel behavior, sort, pagination, and filtering logic unchanged.

## Capabilities

### New Capabilities

- `table-controls-and-workflow-timeline-alignment`: Standardized center-panel layout and timeline presentation patterns for list/detail views.

### Modified Capabilities

- `workspace-navigation-context`: List view placement and sequence requirements for subheading, metrics, and table control rows.
- `cad-detail-information-architecture`: Workflow banner timeline presentation and responsive form-card behavior across Group/Country details.
- `cet-governance-validation`: CET/Sandbox workflow timeline state mapping to stage and terminal status.

## Impact

- Affects `prototype/app.js` list rendering composition and workflow banner rendering.
- Affects `prototype/styles.css` for timeline visuals, list card/table card control rows, and detail form responsiveness.
- Adds OpenSpec artifacts for proposal/design/spec/task traceability under `openspec/changes/align-table-controls-and-workflow-timeline/`.
