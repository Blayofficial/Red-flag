mod commands;
mod domain;
mod shortcuts;
mod state;
mod storage;

use std::sync::Arc;

use tauri::Manager;

use shortcuts::ShortcutsService;
use state::AppState;
use storage::{SnippetRepository, SqliteSnippetRepository};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;

            let repo = SqliteSnippetRepository::new(&app_data_dir.join("quickpaste.db"))?;
            let shortcuts = ShortcutsService::new(app.handle().clone());

            // Register whatever shortcuts were already saved from a
            // previous run — this is what makes shortcuts "just work" on
            // launch, including while the window is minimized.
            shortcuts.sync(&repo.list()?);

            app.manage(AppState {
                repo: Arc::new(repo),
                shortcuts,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_snippets,
            commands::create_snippet,
            commands::update_snippet,
            commands::delete_snippet,
            commands::duplicate_snippet,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
