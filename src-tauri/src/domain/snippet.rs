use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Snippet {
    pub id: String,
    pub name: String,
    pub content: String,
    /// e.g. "Alt+1". `None` means the snippet has no shortcut assigned.
    pub shortcut: Option<String>,
    pub position: i64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct NewSnippet {
    pub name: String,
    pub content: String,
    pub shortcut: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SnippetUpdate {
    pub name: String,
    pub content: String,
    pub shortcut: Option<String>,
}
