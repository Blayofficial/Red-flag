use serde::Serialize;

/// Errors surfaced to the frontend. Kept small and user-meaningful —
/// anything internal (SQL errors, OS/autostart failures, etc.) is
/// collapsed into `Internal`'s message rather than leaking implementation
/// details as separate variants per subsystem.
#[derive(Debug, thiserror::Error, Serialize)]
#[serde(tag = "kind", content = "message")]
pub enum AppError {
    #[error("snippet not found")]
    NotFound,
    #[error("that shortcut is already used by another snippet")]
    DuplicateShortcut,
    #[error("that shortcut couldn't be registered: {0}")]
    ShortcutUnavailable(String),
    #[error("something went wrong: {0}")]
    Internal(String),
}
