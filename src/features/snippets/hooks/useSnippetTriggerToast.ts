import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { useSnippetsStore } from "../../../store/snippetsStore";

const TOAST_DURATION_MS = 2000;

/**
 * Listens for the "snippet-triggered" event the Rust backend emits when a
 * global shortcut fires, selects that snippet, and surfaces a transient
 * toast confirming which one it was. Purely a visual confirmation for
 * now — pasting happens entirely in Rust and doesn't depend on this.
 */
export function useSnippetTriggerToast(): string | null {
  const select = useSnippetsStore((s) => s.select);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const unlisten = listen<string>("snippet-triggered", (event) => {
      const snippetId = event.payload;
      select(snippetId);

      const snippet = useSnippetsStore.getState().snippets.find((s) => s.id === snippetId);
      if (snippet) {
        setToast(`${snippet.shortcut ?? "Shortcut"} → ${snippet.name}`);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [select]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return toast;
}
