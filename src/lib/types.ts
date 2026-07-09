// Mirrors the Rust domain model (src-tauri/src/domain). Kept in sync by hand
// for now; if the shape drifts in practice we can generate this from Rust.

export interface Snippet {
  id: string;
  name: string;
  content: string;
  /** e.g. "Option+1". Null means the snippet has no shortcut assigned. */
  shortcut: string | null;
  position: number;
}

export interface NewSnippet {
  name: string;
  content: string;
  shortcut: string | null;
}

export interface SnippetUpdate {
  name: string;
  content: string;
  shortcut: string | null;
}

/** Shape of the rejected value from a failed Tauri command (see AppError in Rust). */
export interface ApiError {
  kind: "NotFound" | "DuplicateShortcut" | "ShortcutUnavailable" | "Internal";
  message?: string | null;
}

export function friendlyErrorMessage(err: unknown): string {
  const apiErr = err as Partial<ApiError> | undefined;
  switch (apiErr?.kind) {
    case "DuplicateShortcut":
      return "That shortcut is already used by another snippet.";
    case "ShortcutUnavailable":
      return "That shortcut couldn't be registered — it may already be in use by another running application.";
    case "NotFound":
      return "That snippet no longer exists.";
    case "Internal":
      return apiErr.message || "Something went wrong.";
    default:
      return "Something went wrong. Please try again.";
  }
}
