use std::sync::Arc;

use crate::storage::SnippetRepository;

pub struct AppState {
    pub repo: Arc<dyn SnippetRepository>,
}
