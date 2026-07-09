mod commands;
mod domain;
mod paste;
mod shortcuts;
mod state;
mod storage;
mod tray;

use std::sync::Arc;

use tauri::{Manager, WindowEvent};

use shortcuts::ShortcutsService;
use state::AppState;
use storage::{SnippetRepository, SqliteSnippetRepository};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;

            let repo: Arc<dyn SnippetRepository> =
                Arc::new(SqliteSnippetRepository::new(&app_data_dir.join("quickpaste.db"))?);
            let shortcuts = ShortcutsService::new(app.handle().clone(), repo.clone());

            // Register whatever shortcuts were already saved from a
            // previous run — this is what makes shortcuts "just work" on
            // launch, including while the window is minimized.
            shortcuts.sync(&repo.list()?);

            app.manage(AppState { repo, shortcuts });

            tray::setup(app.handle())?;

            Ok(())
        })
        // Closing the main window hides it instead of quitting — QuickPaste
        // is meant to run quietly in the background, reachable via the
        // tray icon. Quitting is a deliberate action (tray menu → Quit).
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
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
