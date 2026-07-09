use tauri::State;

use crate::domain::{AppError, NewSnippet, Snippet, SnippetUpdate};
use crate::state::AppState;

#[tauri::command]
pub fn list_snippets(state: State<AppState>) -> Result<Vec<Snippet>, AppError> {
    state.repo.list()
}

#[tauri::command]
pub fn create_snippet(state: State<AppState>, input: NewSnippet) -> Result<Snippet, AppError> {
    let created = state.repo.create(input)?;

    if let Err(err) = sync_shortcuts_for(&state, &created.id) {
        // The row is only valid if its shortcut actually registered with
        // the OS — roll it back rather than leave a snippet whose shortcut
        // silently doesn't work.
        let _ = state.repo.delete(&created.id);
        return Err(err);
    }

    Ok(created)
}

#[tauri::command]
pub fn update_snippet(
    state: State<AppState>,
    id: String,
    input: SnippetUpdate,
) -> Result<Snippet, AppError> {
    let previous = state
        .repo
        .list()?
        .into_iter()
        .find(|s| s.id == id)
        .ok_or(AppError::NotFound)?;

    let updated = state.repo.update(&id, input)?;

    if let Err(err) = sync_shortcuts_for(&state, &id) {
        let _ = state.repo.update(
            &id,
            SnippetUpdate {
                name: previous.name,
                content: previous.content,
                shortcut: previous.shortcut,
            },
        );
        // Re-sync once more so the OS registration matches the
        // now-reverted row instead of the rejected one.
        let _ = state.shortcuts.sync(&state.repo.list().unwrap_or_default());
        return Err(err);
    }

    Ok(updated)
}

#[tauri::command]
pub fn delete_snippet(state: State<AppState>, id: String) -> Result<(), AppError> {
    state.repo.delete(&id)?;
    // Unregistering a shortcut can't meaningfully fail in a way the user
    // can act on, so there's nothing to roll back here.
    state.shortcuts.sync(&state.repo.list()?);
    Ok(())
}

#[tauri::command]
pub fn duplicate_snippet(state: State<AppState>, id: String) -> Result<Snippet, AppError> {
    // Duplicates never carry a shortcut over (see storage layer), so there
    // is nothing new to register.
    state.repo.duplicate(&id)
}

fn sync_shortcuts_for(state: &AppState, snippet_id: &str) -> Result<(), AppError> {
    let snippets = state.repo.list()?;
    let failures = state.shortcuts.sync(&snippets);

    if let Some(failure) = failures.into_iter().find(|f| f.snippet_id == snippet_id) {
        return Err(AppError::ShortcutUnavailable(failure.message));
    }

    Ok(())
}
