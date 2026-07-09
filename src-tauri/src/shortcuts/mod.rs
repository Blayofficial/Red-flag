use std::collections::HashMap;
use std::sync::Mutex;

use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

use crate::domain::Snippet;

/// Emitted (with the triggered snippet's id as payload) whenever a
/// registered global shortcut fires. The frontend uses this purely to show
/// which snippet fired, for now — the actual paste happens entirely in
/// Rust and never needs a round trip through the webview.
pub const SNIPPET_TRIGGERED_EVENT: &str = "snippet-triggered";

/// A shortcut that couldn't be registered with the OS — most commonly
/// because another running application already claimed that combination.
pub struct ShortcutRegistrationFailure {
    pub snippet_id: String,
    pub message: String,
}

/// Keeps the OS-registered global shortcuts in sync with whichever
/// snippets currently have one assigned. `sync` diffs against what's
/// currently registered rather than blindly re-registering everything, so
/// it's safe (and cheap) to call after every create/update/delete/duplicate.
pub struct ShortcutsService {
    app: AppHandle,
    registered: Mutex<HashMap<String, String>>, // shortcut string -> snippet id
}

impl ShortcutsService {
    pub fn new(app: AppHandle) -> Self {
        Self {
            app,
            registered: Mutex::new(HashMap::new()),
        }
    }

    pub fn sync(&self, snippets: &[Snippet]) -> Vec<ShortcutRegistrationFailure> {
        let desired: HashMap<String, String> = snippets
            .iter()
            .filter_map(|s| s.shortcut.clone().map(|shortcut| (shortcut, s.id.clone())))
            .collect();

        let mut registered = self.registered.lock().unwrap();

        // Anything currently registered that either lost its shortcut or
        // whose shortcut string now belongs to a different snippet.
        let stale: Vec<String> = registered
            .iter()
            .filter(|(shortcut, id)| desired.get(shortcut.as_str()) != Some(*id))
            .map(|(shortcut, _)| shortcut.clone())
            .collect();

        for shortcut in &stale {
            if let Err(err) = self.app.global_shortcut().unregister(shortcut.as_str()) {
                // Non-fatal: worst case a stale hotkey stays registered
                // until the app restarts. Logged for diagnosis, not
                // surfaced to the user since there's no action they can take.
                eprintln!("quickpaste: failed to unregister shortcut {shortcut}: {err}");
            }
            registered.remove(shortcut);
        }

        let mut failures = Vec::new();

        for (shortcut, snippet_id) in &desired {
            if registered.get(shortcut) == Some(snippet_id) {
                continue; // already registered to the right snippet
            }

            let app_for_handler = self.app.clone();
            let snippet_id_for_handler = snippet_id.clone();
            let result = self.app.global_shortcut().on_shortcut(
                shortcut.as_str(),
                move |_app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let _ = app_for_handler
                            .emit(SNIPPET_TRIGGERED_EVENT, snippet_id_for_handler.clone());
                    }
                },
            );

            match result {
                Ok(()) => {
                    registered.insert(shortcut.clone(), snippet_id.clone());
                }
                Err(err) => failures.push(ShortcutRegistrationFailure {
                    snippet_id: snippet_id.clone(),
                    message: err.to_string(),
                }),
            }
        }

        failures
    }
}
