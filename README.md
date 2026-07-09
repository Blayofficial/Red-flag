# QuickPaste

A macOS desktop app that removes repetitive copy-paste. Save snippets once,
paste them anywhere with global keyboard shortcuts (`Option+1`–`Option+9` by
default) — works even while the app is minimized to the menu bar.

## Status

All 7 planned phases are built: snippet storage (SQLite), global shortcuts,
the paste engine (clipboard + simulated keystroke + restore), the menu bar
icon, and settings (launch at login, plus groundwork for more shortcut
modifier options later). A final polish pass (Phase 8) is still to come.

## Stack

- [Tauri 2](https://tauri.app/) (Rust backend, OS integration)
- React 19 + TypeScript + Vite
- Tailwind CSS
- Zustand (frontend state)
- SQLite (via `rusqlite`) for snippet storage

## Project structure

```
src/                     React frontend
  features/snippets/     snippet list + editor UI
  features/settings/     settings UI (launch at login, modifier key)
  components/ui/         reusable UI primitives
  lib/api/                typed wrappers around Tauri commands
  lib/types.ts             shared TS types mirroring the Rust domain model
  store/                   frontend state (zustand)
src-tauri/                Rust backend — all OS integration lives here
  src/domain/              Snippet types + app-wide error type
  src/storage/             SQLite repository + schema migrations
  src/shortcuts/           global shortcut registration/sync
  src/paste/               clipboard write + simulated paste + restore
  src/tray.rs              menu bar icon + Open/Quit menu
  src/commands/            Tauri IPC handlers (thin, call into the above)
```

## Prerequisites

- [Rust](https://rustup.rs)
- [Node.js](https://nodejs.org)
- Xcode Command Line Tools (`xcode-select --install`)

## Running it

```bash
npm install
npm run tauri dev
```

## Required macOS permission

QuickPaste simulates a paste keystroke to get snippet text into whatever
app you're using, which macOS only allows for apps granted **Accessibility**
permission. The first time a shortcut fires, macOS should prompt you; if it
doesn't (or if pasting silently does nothing), open **System Settings →
Privacy & Security → Accessibility** and enable QuickPaste manually.

## Testing

- `npm run build` — typechecks and builds the frontend.
- `npm run tauri dev` — opens the app window. Create a snippet, assign it an
  Option+1–9 shortcut, then try it from another app (Notes, Mail, a browser).
  Quitting via the window's close button should leave QuickPaste running in
  the menu bar — use the menu bar icon's Quit item to actually exit.
- `cd src-tauri && cargo test` — runs the storage layer's unit tests.

## Recommended IDE setup

[VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
