import { useSnippetsStore } from "../../../store/snippetsStore";
import { Button } from "../../../components/ui/Button";

export function SnippetEditor() {
  const snippets = useSnippetsStore((s) => s.snippets);
  const selectedId = useSnippetsStore((s) => s.selectedId);
  const snippet = snippets.find((s) => s.id === selectedId);

  if (!snippet) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-neutral-500">
        Select a snippet to view it here.
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <input
          defaultValue={snippet.name}
          disabled
          className="w-full max-w-sm bg-transparent text-lg font-semibold text-neutral-100 outline-none disabled:opacity-90"
        />
        <div className="flex gap-2">
          <Button variant="secondary" disabled title="Wired up in a later phase">
            Duplicate
          </Button>
          <Button variant="danger" disabled title="Wired up in a later phase">
            Delete
          </Button>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Shortcut
        </span>
        <input
          defaultValue={snippet.shortcut ?? ""}
          placeholder="Not set"
          disabled
          className="w-40 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200 outline-none disabled:opacity-90"
        />
      </label>

      <label className="flex flex-1 flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Content
        </span>
        <textarea
          defaultValue={snippet.content}
          disabled
          className="flex-1 resize-none rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm leading-relaxed text-neutral-200 outline-none disabled:opacity-90"
        />
      </label>

      <div className="flex justify-end gap-2">
        <Button variant="primary" disabled title="Wired up in a later phase">
          Save
        </Button>
      </div>
    </main>
  );
}
