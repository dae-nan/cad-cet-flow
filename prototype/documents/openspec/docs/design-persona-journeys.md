# Design Document: Personas and Journey Architecture

## 1. Persona Catalog

### RM Persona Card
- **Name:** Ravi Menon
- **Role:** 1st Line RM
- **Primary Need:** Initiate and maintain draft quality with clear ownership boundaries.
- **Pain Point:** Ambiguous stage states and inconsistent edit controls.

### Business Proposer Persona Card
- **Name:** Priya Nair
- **Role:** Business Proposer (1st line head)
- **Primary Need:** Validate commercial narrative and submit with confidence.
- **Pain Point:** Missing handoff clarity between proposer and 2nd line.

### Approver Persona Card
- **Name:** Daniel Chua
- **Role:** 2nd Line Approver
- **Primary Need:** Review quickly, provide actionable commentary, and record decisions.
- **Pain Point:** Decision context can be scattered across sections.

### Governance Admin Persona Card
- **Name:** Aisha Lim
- **Role:** Governance Admin
- **Primary Need:** Enforce policy controls and maintain auditability.
- **Pain Point:** Hard to confirm policy intent is consistently represented in UI and docs.

## 2. Journey Model

Each persona journey is modeled using JTBD dimensions and backed by explicit usecases in the structured source file.

### RM Journey
- Enters Home/Inbox, triages owned drafts, updates RM-owned sections, submits to proposer.
- Uses timeline and status semantics to detect where rework is needed.

### Business Proposer Journey
- Reviews submitted RM draft, updates proposer-owned sections, forwards to 2nd line.
- Validates scope and commercial context before formal submission.

### Approver Journey
- Reviews decision package, adds section comments + end commentary, resolves with accept/caveat/reject.
- Triggers downstream rework states where applicable.

### Governance Journey
- Reviews policy boundaries, monitors governance alerts, checks role/access intent.
- Validates that documentation and scenario mapping remain consistent with controls.

## 3. Design Principles

- **PRD-first clarity:** Lead with intent, not implementation detail.
- **Traceability by default:** Every journey element maps to specs and routes.
- **Single source timeline:** Use data-driven generation to prevent drift.
- **Role-aware language:** Keep persona labels and usecase context explicit.
