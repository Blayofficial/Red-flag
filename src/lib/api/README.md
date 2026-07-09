# lib/api

Typed wrappers around Tauri `invoke` calls go here (e.g. `listSnippets()`,
`saveSnippet()`). This is the only place the frontend is allowed to talk to
the Rust backend — components never call `invoke` directly.

Populated starting in Phase 3, once the backend commands exist.
