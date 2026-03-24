## ADDED Requirements

### Requirement: Markdown viewer SHALL support approved documentation roots
The markdown viewer SHALL accept `?doc=` paths under approved internal roots `changes/` and `docs/`.

#### Scenario: User opens docs markdown from index
- **WHEN** `viewer.html?doc=docs/master-prd.md` is requested
- **THEN** the viewer SHALL fetch and render the markdown content

### Requirement: Markdown viewer SHALL preserve path safety controls
The viewer SHALL reject unsafe or disallowed path inputs.

#### Scenario: Unsafe path input
- **WHEN** the `doc` query value is absolute, contains traversal segments, or targets unsupported roots/extensions
- **THEN** the viewer SHALL block rendering and display an invalid path error

### Requirement: Viewer query contract SHALL remain stable
The runtime viewer SHALL continue using `?doc=<relative-path>` as the sole navigation contract for markdown rendering.

#### Scenario: Existing change links are used
- **WHEN** a link targets `viewer.html?doc=changes/.../spec.md`
- **THEN** it SHALL continue to resolve without requiring link format changes
