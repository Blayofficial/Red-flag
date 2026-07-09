// Mirrors the Rust domain model (src-tauri/src/domain). Kept in sync by hand
// for now; if the shape drifts in practice we can generate this from Rust.

export interface Snippet {
  id: string;
  name: string;
  content: string;
  /** e.g. "Alt+1". Null means the snippet has no shortcut assigned. */
  shortcut: string | null;
}
