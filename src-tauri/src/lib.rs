mod commands;
mod domain;
mod state;
mod storage;

use std::sync::Arc;

use tauri::Manager;

use state::AppState;
use storage::SqliteSnippetRepository;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;

            let repo = SqliteSnippetRepository::new(&app_data_dir.join("quickpaste.db"))?;
            app.manage(AppState {
                repo: Arc::new(repo),
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
