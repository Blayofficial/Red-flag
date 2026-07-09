use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

use crate::domain::Snippet;
use crate::paste;
use crate::storage::SnippetRepository;

/// Emitted (with the triggered snippet's id as payload) whenever a
/// registered global shortcut fires. The frontend uses this purely to show
/// which snippet fired — the actual paste happens entirely in Rust below
/// and never needs a round trip through the webview.
pub const SNIPPET_TRIGGERED_EVENT: &str = "snippet-triggered";

/// A shortcut that couldn't be registered with the OS — most commonly
/// because another running application already claimed that combination.
pub struct ShortcutRegistrationFailure {
    pub snippet_id: String,
    pub message: String,
}

/// Keeps the OS-registered global shortcuts in sync with whichever
/// snippets currently have one assigned, and pastes the right snippet when
/// one fires. `sync` diffs against what's currently registered rather than
/// blindly re-registering everything, so it's safe (and cheap) to call
/// after every create/update/delete/duplicate.
pub struct ShortcutsService {
    app: AppHandle,
    repo: Arc<dyn SnippetRepository>,
    registered: Mutex<HashMap<String, String>>, // shortcut string -> snippet id
}

impl ShortcutsService {
    pub fn new(app: AppHandle, repo: Arc<dyn SnippetRepository>) -> Self {
        Self {
            app,
            repo,
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
            let repo_for_handler = self.repo.clone();
            let snippet_id_for_handler = snippet_id.clone();
            let result = self.app.global_shortcut().on_shortcut(
                shortcut.as_str(),
                move |_app, _shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }

                    // Look up fresh content rather than capturing it at
                    // registration time — the snippet may have been edited
                    // since without its shortcut (and thus this closure)
                    // changing.
                    let Ok(snippets) = repo_for_handler.list() else {
                        return;
                    };
                    let Some(snippet) =
                        snippets.into_iter().find(|s| s.id == snippet_id_for_handler)
                    else {
                        return;
                    };

                    let _ = app_for_handler.emit(SNIPPET_TRIGGERED_EVENT, snippet.id.clone());
                    paste::paste_snippet(&app_for_handler, snippet.content);
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
