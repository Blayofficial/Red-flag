import { useEffect, useState } from "react";
import { useSnippetsStore } from "../../../store/snippetsStore";
import { Button } from "../../../components/ui/Button";
import { ShortcutSelect } from "../../../components/ui/ShortcutSelect";

export function SnippetEditor() {
  const snippets = useSnippetsStore((s) => s.snippets);
  const selectedId = useSnippetsStore((s) => s.selectedId);
  const saveSnippet = useSnippetsStore((s) => s.saveSnippet);
  const deleteSnippet = useSnippetsStore((s) => s.deleteSnippet);
  const duplicateSnippet = useSnippetsStore((s) => s.duplicateSnippet);

  const snippet = snippets.find((s) => s.id === selectedId);

  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [shortcut, setShortcut] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Resets the form whenever the *selected snippet* changes — switching
  // snippets with unsaved edits discards them, same as most single-pane
  // editors. Worth revisiting later if that surprises real users.
  useEffect(() => {
    setName(snippet?.name ?? "");
    setContent(snippet?.content ?? "");
    setShortcut(snippet?.shortcut ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snippet?.id]);

  if (!snippet) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-neutral-500">
        Select a snippet, or create one to get started.
      </main>
    );
  }

  const isDirty =
    name !== snippet.name || content !== snippet.content || shortcut !== snippet.shortcut;

  const takenShortcuts = snippets
    .filter((s) => s.id !== snippet.id)
    .map((s) => s.shortcut)
    .filter((s): s is string => s !== null);

  async function handleSave() {
    setSaving(true);
    try {
      await saveSnippet(snippet!.id, { name, content, shortcut });
    } catch {
      // store already recorded a friendly error for the banner
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (window.confirm(`Delete "${snippet!.name}"? This can't be undone.`)) {
      deleteSnippet(snippet!.id);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
      <div className="flex items-center justify-between gap-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Snippet name"
          className="w-full max-w-sm bg-transparent text-lg font-semibold text-neutral-100 outline-none placeholder:text-neutral-600"
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => duplicateSnippet(snippet.id)}>
            Duplicate
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Shortcut
        </span>
        <ShortcutSelect value={shortcut} onChange={setShortcut} takenShortcuts={takenShortcuts} />
      </label>

      <label className="flex flex-1 flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Content
        </span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 resize-none rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm leading-relaxed text-neutral-200 outline-none focus:border-neutral-700"
        />
      </label>

      <div className="flex justify-end gap-2">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!isDirty || saving || !name.trim()}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </main>
  );
}
