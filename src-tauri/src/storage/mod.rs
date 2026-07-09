mod migrations;
mod sqlite;

pub use sqlite::SqliteSnippetRepository;

use crate::domain::{AppError, NewSnippet, Snippet, SnippetUpdate};

/// Storage is behind a trait so the SQLite implementation can be swapped
/// (e.g. for a future sync-aware backend) without touching commands or the
/// domain model.
pub trait SnippetRepository: Send + Sync {
    fn list(&self) -> Result<Vec<Snippet>, AppError>;
    fn create(&self, new: NewSnippet) -> Result<Snippet, AppError>;
    fn update(&self, id: &str, update: SnippetUpdate) -> Result<Snippet, AppError>;
    fn delete(&self, id: &str) -> Result<(), AppError>;
    fn duplicate(&self, id: &str) -> Result<Snippet, AppError>;
}
