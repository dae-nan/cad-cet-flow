# JTBD and Usecase Registry

This registry summarizes the structured source powering timeline generation.

## Schema Fields (required)

- `personaId`
- `personaName`
- `character`
- `journeyStage`
- `title`
- `jtbd.functional`
- `jtbd.emotional`
- `jtbd.social`
- `trigger`
- `desiredOutcome`
- `openSpecLink`
- `idealScenario`
- `edgeCases[]`
- `sampleData`
- `uiRoute`
- `dataDesign`

## Usecase Coverage

See canonical source at:
- `../data/persona-jtbd-usecases.json`

All records in this source include:
- Linked OpenSpec requirement source
- Ideal scenario path
- Edge-case handling notes
- Sample data snippets
- Relevant prototype route where applicable
- Data design impacts (API/data-model guidance)
