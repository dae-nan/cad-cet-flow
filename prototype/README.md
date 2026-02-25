# CAD CET Flow Prototype

## Run
- Open `/Users/daenan/Code/delegations/prototype/index.html` directly, or run a local server.

## Routing state
- `#/home` (default)
- `#/cad/:groupCadId`
- `#/cad/:groupCadId/:country/:countryCadId`
- `#/cad/:groupCadId/:country/:countryCadId/:cetId`
- `#/cad/:groupCadId/:country/:countryCadId/:sandboxId`

## UX behavior updates
- Left panel contains document filters as row sub-options (not tags):
  - Group CADs, Country CADs, CETs, Sandboxes
  - Active / In Flight / Completed
- Left panel quick views: All Docs, Inbox, My Docs, Needs Action, Governance Alerts.
- Homepage default quick view is `Needs Action`.
- Drilldown pages hide document filters and show breadcrumb-synced trace + section submenus.
- Breadcrumb is clickable per level (home -> group -> country -> child).
- Collapsed panel shows an opened-document indicator icon.
- Homepage mode:
  - High-level user metrics + quick actions
  - Search bar in main content panel top
  - Filtered selected-view table
- Hierarchy Explorer mode:
  - Default content is only hierarchical tree grid
  - Search bar elevated in main content top
  - Product/segment/cluster/country filters attached to hierarchy table area
  - Sub-text shown: `Selected view: ...`
- Hierarchy tree interactions:
  - Expand/collapse group rows
  - Expand/collapse country rows
  - Expand all / Collapse all

## Data
- `/Users/daenan/Code/delegations/prototype/data/sample-hierarchy.json`
- `/Users/daenan/Code/delegations/prototype/data/sample-hierarchy.js` (embedded fallback for file mode)
