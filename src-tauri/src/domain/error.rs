use serde::Serialize;

/// Errors surfaced to the frontend. Kept small and user-meaningful —
/// anything internal (SQL details, etc.) is collapsed into `Storage`'s
/// message rather than leaking implementation details as separate variants.
#[derive(Debug, thiserror::Error, Serialize)]
#[serde(tag = "kind", content = "message")]
pub enum AppError {
    #[error("snippet not found")]
    NotFound,
    #[error("that shortcut is already used by another snippet")]
    DuplicateShortcut,
    #[error("something went wrong saving your data: {0}")]
    Storage(String),
}
