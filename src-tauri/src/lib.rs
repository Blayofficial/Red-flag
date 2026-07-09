// Rust backend entry point. Domain/storage/shortcuts/paste modules land here
// starting in Phase 2 — Phase 1 is UI-shell only, so there's nothing to wire
// up yet beyond the default Tauri app.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
