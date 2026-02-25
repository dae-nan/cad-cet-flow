# CAD CET Flow Prototype

## Run
Serve this folder and open in browser:
- `cd /Users/daenan/Code/delegations/prototype`
- `python3 -m http.server 8080`
- open `http://localhost:8080`

## Routing state
- `#/home` (default)
- `#/cad/:groupCadId`
- `#/cad/:groupCadId/:country/:countryCadId`
- `#/cad/:groupCadId/:country/:countryCadId/:cetId`
- `#/cad/:groupCadId/:country/:countryCadId/:sandboxId`

## Implemented updates
- Homepage is default and independent from detail views.
- Homepage includes direct status panels for:
  - Group CADs
  - Country CADs
  - CETs
  - Sandboxes
- Hierarchical parent-child tree grid with counts (`CETs`, `SBX`) on country CAD rows.
- Global search enabled across document types and fields:
  - `ID`, `Name`, `Country`, `Owner`, plus product/segment text
- Filters:
  - Product, Client Segment, Cluster, Country, Status
  - `My Docs` toggle based on user profile scope
- Dynamic right issue panel retained with live blocker/error/warning updates.

## Data
- Hierarchy data source: `/Users/daenan/Code/delegations/prototype/data/sample-hierarchy.json`
