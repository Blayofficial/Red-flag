# QuickPaste

A Windows desktop app that removes repetitive copy-paste. Save snippets once,
paste them anywhere with global keyboard shortcuts (`Alt+1`–`Alt+9` by
default) — works even while the app is minimized.

## Status

**Phase 1** — project scaffold and static dark-mode UI shell (sidebar +
snippet editor layout). No backend logic yet: the snippet list is
placeholder data and the editor/buttons are inert. See the architecture
notes in the project history for the full phase roadmap.

## Stack

- [Tauri 2](https://tauri.app/) (Rust backend, OS integration)
- React 19 + TypeScript + Vite
- Tailwind CSS
- Zustand (frontend state)

## Project structure

```
src/                     React frontend
  features/snippets/     snippet list + editor UI
  features/settings/     settings UI (added in a later phase)
  components/ui/         reusable UI primitives
  lib/api/               typed wrappers around Tauri commands (added in a later phase)
  lib/types.ts           shared TS types mirroring the Rust domain model
  store/                 frontend state (zustand)
src-tauri/                Rust backend — all OS integration lives here
```

## Prerequisites

Install the Tauri prerequisites for your OS: https://tauri.app/start/prerequisites/
(on Windows this is the MSVC build tools + WebView2, usually already present).

## Running it

```bash
npm install
npm run tauri dev
```

## Testing this phase

- `npm run build` — typechecks and builds the frontend.
- `npm run tauri dev` — opens the app window; you should see the dark sidebar
  with four placeholder snippets (Subject line, Cold email, Calendly link,
  LinkedIn message) and the editor panel on the right showing the selected
  snippet's content. Clicking snippets in the sidebar switches the editor
  content. Buttons are intentionally disabled — they're wired up in later
  phases.

## Recommended IDE setup

[VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
