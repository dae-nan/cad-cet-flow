# AGENTS.md

## Cursor Cloud specific instructions

This is a pure static HTML/CSS/JS prototype with no build tools, no package manager, and no backend. All application code lives in `prototype/`.

### Running the app

Serve the `prototype/` directory with any static HTTP server:

```
cd prototype && python3 -m http.server 8080
```

Then open `http://localhost:8080/#/home` in a browser. The app uses hash-based client-side routing.

### Key gotchas

- The app can run via `file://` protocol, but `fetch()` for JSON data files will fail; it falls back to embedded data in `data/sample-hierarchy.js`. Always use an HTTP server for full functionality.
- There is no lint, test, or build toolchain configured. No `package.json`, `node_modules`, or CI pipeline exists.
- All sample data is in `prototype/data/*.json` and the JS fallback in `prototype/data/sample-hierarchy.js`.
- Routing state is defined in `prototype/README.md`.
