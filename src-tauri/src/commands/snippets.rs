use tauri::State;

use crate::domain::{AppError, NewSnippet, Snippet, SnippetUpdate};
use crate::state::AppState;

#[tauri::command]
pub fn list_snippets(state: State<AppState>) -> Result<Vec<Snippet>, AppError> {
    state.repo.list()
}

#[tauri::command]
pub fn create_snippet(state: State<AppState>, input: NewSnippet) -> Result<Snippet, AppError> {
    state.repo.create(input)
}

#[tauri::command]
pub fn update_snippet(
    state: State<AppState>,
    id: String,
    input: SnippetUpdate,
) -> Result<Snippet, AppError> {
    state.repo.update(&id, input)
}

#[tauri::command]
pub fn delete_snippet(state: State<AppState>, id: String) -> Result<(), AppError> {
    state.repo.delete(&id)
}

#[tauri::command]
pub fn duplicate_snippet(state: State<AppState>, id: String) -> Result<Snippet, AppError> {
    state.repo.duplicate(&id)
}
