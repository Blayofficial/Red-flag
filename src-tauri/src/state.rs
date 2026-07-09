use std::sync::Arc;

use crate::shortcuts::ShortcutsService;
use crate::storage::SnippetRepository;

pub struct AppState {
    pub repo: Arc<dyn SnippetRepository>,
    pub shortcuts: ShortcutsService,
}
