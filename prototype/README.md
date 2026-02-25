# Prototype: Dynamic Right Error/Blocker Panel

## Run
Open `/Users/daenan/Code/delegations/prototype/index.html` in a browser from a local web server so JSON fetch works.

Example:
- `cd /Users/daenan/Code/delegations/prototype`
- `python3 -m http.server 8080`
- open `http://localhost:8080`

## What is implemented
- Derived `issueStore` with prioritized active issues:
  - `Blocker` (governance)
  - `Field` (required inputs)
  - `Warning` (rationale/ack required)
- `rightPanel` state with filter, live updates, and auto-close when all issues are resolved.
- Right panel content includes issue type, message, location, hint, and `Go to field/rule` action.
- Submit state follows unresolved issues.
- Responsive behavior:
  - Desktop: right rail panel
  - Tablet: right slide-over drawer + backdrop
  - Mobile: bottom sheet panel (iPhone class viewport)

## Manual test checklist
1. Clear `Country` and `Client Segment` fields.
- Expected: field issues appear instantly; panel opens.
2. Set exposure values to exceed cap (`60 + 55 > 100`).
- Expected: blocker appears with numeric hint `current / allowed / delta`.
3. Reduce exposures below cap and complete required fields.
- Expected: blocker removed immediately.
4. Set utilization near threshold and keep rationale/ack incomplete.
- Expected: warning appears; submit remains disabled until rationale + ack completed.
5. Resolve final issue.
- Expected: "All issues resolved" banner appears briefly, then panel closes.
6. Tap `Go to field/rule` from any issue.
- Expected: viewport scrolls to correct field/section.

## Property-based statements (simplified English)
1. For any form state, if active issue count is zero, the issue panel must hide after showing success briefly.
2. For any blocker issue, submit must stay disabled until that blocker is gone.
3. For any issue that is resolved by user input, that issue must disappear from the active list immediately.
4. For any active issue, `Go to field/rule` must navigate to a valid visible target element.
