## Overview

This change enforces parity between Home and Inbox interaction patterns while adding explicit intermediate CAD lifecycle states used by operating teams (`PROPOSING`, `APPROVING`). The implementation prioritizes predictable visual rhythm, status ordering consistency, and mobile-first discoverability.

## UX Decisions

1. **Status semantics**
- Group/Country CAD status set becomes: `DRAFT`, `PROPOSING`, `APPROVING`, `ACTIVE`, `RETIRED`.
- CET/Sandbox status set remains: `DRAFT`, `INFLIGHT`, `SUCCESS`, `FAILED`.
- Cards and sub-filters render statuses in canonical order per type.

2. **Home/Inbox center-card parity**
- Sequence for both pages: search -> metrics -> table filter row.
- `table-filter-row` spacing is normalized and not dependent on selected sub-filter.

3. **Inbox scope model**
- Inbox center filter row uses scope controls (`My Inbox`, `Team Inbox`) for row filtering.
- Laptop left panel removes separate Inbox Scope section.
- Mobile collapsed rail adds scope pills (`Me`, `Tm`) after document filter icons.

4. **Ownership and table readability**
- Use short ownership labels (`RM`, `Proposer`, `Approver`) and keep full-name hover where visible.
- Move `Status` to last column in key list/detail tables to improve scan order.

5. **Portfolio monitoring cards**
- Replace generic KPI set with exposure-by-segment cards:
  - Wealth
  - Retail
  - SME Business Banking (aggregates `SME` + `Business Banking`)
- Each card includes amount, utilization, and mini trend bars.

6. **Forms and workflow banner**
- Remove nested clipping and card-level scroll traps on Group/Country/CET/Sandbox detail routes.
- Show workflow progress as a horizontal timeline, while preserving acting-role control.

7. **Docs layout and breadcrumb**
- Docs breadcrumb uses `Credit Approvals / Help / Documentation / OpenSpec`, with `Credit Approvals` linked back to home.
- Docs content flexes to wider desktop while reflowing for narrow screens.
