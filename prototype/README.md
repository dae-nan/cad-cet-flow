# CAD CET Flow Prototype

## Run
Preferred:
- `cd /Users/daenan/Code/delegations/prototype`
- `python3 -m http.server 8080`
- open `http://localhost:8080`

Fallback behavior:
- If you open `index.html` directly and JSON fetch fails, the app now loads embedded sample data and shows a warning banner.

## Routing state
- `#/home` (default)
- `#/cad/:groupCadId`
- `#/cad/:groupCadId/:country/:countryCadId`
- `#/cad/:groupCadId/:country/:countryCadId/:cetId`
- `#/cad/:groupCadId/:country/:countryCadId/:sandboxId`

## Implemented updates
- Homepage default independent route.
- Direct status panels for Group CADs, Country CADs, CETs, Sandboxes.
- Cross-type global search across ID, name, country, owner.
- Filters for product, client segment, cluster, country, status, and `My Docs` toggle.
- Hierarchical parent-child grid with country-level CET/SBX counts.
- Quick deep-link section to test individual Group, Country, CET, Sandbox routes.
- Dynamic right issue panel retained (desktop rail/tablet drawer/mobile bottom sheet).

## Data
- Full sample hierarchy: `/Users/daenan/Code/delegations/prototype/data/sample-hierarchy.json`
- Includes mixed states (`Active`, `In Flight`, `Completed`) across all entity types.
- Embedded fallback dataset (same content): `/Users/daenan/Code/delegations/prototype/data/sample-hierarchy.js`
