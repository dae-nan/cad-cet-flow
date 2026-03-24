# Data Design Reference

## 1. Structured Source Contract

Primary source for documentation timeline and usecases:
- `data/persona-jtbd-usecases.json`

### Top-level shape

```json
{
  "personas": [{ "id": "rm", "label": "1st Line RM" }],
  "usecases": [{ "id": "uc-rm-001", "personaId": "rm", "title": "..." }]
}
```

## 2. Usecase Data Model (required keys)

- `id` string
- `personaId` string
- `personaName` string
- `character` string
- `journeyStage` string
- `title` string
- `jtbd` object with `functional`, `emotional`, `social`
- `trigger` string
- `desiredOutcome` string
- `openSpecLink` string (viewer path)
- `idealScenario` string
- `edgeCases` string[]
- `sampleData` object
- `uiRoute` string
- `dataDesign` object with `apis` string[] and `models` string[]

## 3. API / Interface Notes

No backend calls are introduced for this change; the documentation page reads local JSON via `fetch("data/persona-jtbd-usecases.json")`.

Viewer interface remains:
- `viewer.html?doc=<relative-path>`

## 4. Data Lifecycle

1. Update OpenSpec capability/spec links.
2. Update `persona-jtbd-usecases.json` records.
3. Timeline rendering updates automatically on page refresh.
4. Usecase details remain source-of-truth for scenario narratives and sample payloads.
