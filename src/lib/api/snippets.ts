import { invoke } from "@tauri-apps/api/core";
import type { NewSnippet, Snippet, SnippetUpdate } from "../types";

// The only place the frontend is allowed to call `invoke` — components go
// through these typed wrappers instead of talking to Tauri directly.

export function listSnippets(): Promise<Snippet[]> {
  return invoke("list_snippets");
}

export function createSnippet(input: NewSnippet): Promise<Snippet> {
  return invoke("create_snippet", { input });
}

export function updateSnippet(id: string, input: SnippetUpdate): Promise<Snippet> {
  return invoke("update_snippet", { id, input });
}

export function deleteSnippet(id: string): Promise<void> {
  return invoke("delete_snippet", { id });
}

export function duplicateSnippet(id: string): Promise<Snippet> {
  return invoke("duplicate_snippet", { id });
}
