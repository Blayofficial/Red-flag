import { useSnippetsStore } from "../../../store/snippetsStore";
import { useUiStore } from "../../../store/uiStore";
import { ShortcutBadge } from "../../../components/ui/ShortcutBadge";
import { Button } from "../../../components/ui/Button";

export function Sidebar() {
  const snippets = useSnippetsStore((s) => s.snippets);
  const selectedId = useSnippetsStore((s) => s.selectedId);
  const select = useSnippetsStore((s) => s.select);
  const createSnippet = useSnippetsStore((s) => s.createSnippet);
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);

  return (
    <aside className="flex h-full w-64 flex-none flex-col border-r border-neutral-800 bg-neutral-950">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500 text-xs font-bold text-white">
            Q
          </div>
          <span className="text-sm font-semibold text-neutral-100">QuickPaste</span>
        </div>
        <button
          onClick={() => setView("settings")}
          title="Settings"
          aria-label="Settings"
          className={`rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-200 ${
            view === "settings" ? "bg-neutral-800 text-neutral-100" : ""
          }`}
        >
          ⚙
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        {snippets.length === 0 && (
          <p className="px-3 py-2 text-sm text-neutral-500">
            No snippets yet — create one to get started.
          </p>
        )}
        <ul className="flex flex-col gap-0.5">
          {snippets.map((snippet) => {
            const isSelected = view === "snippets" && snippet.id === selectedId;
            return (
              <li key={snippet.id}>
                <button
                  onClick={() => {
                    select(snippet.id);
                    setView("snippets");
                  }}
                  className={`flex w-full flex-col gap-1 rounded-md px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? "bg-neutral-800 text-neutral-100"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                  }`}
                >
                  <span className="truncate text-sm font-medium">{snippet.name}</span>
                  <ShortcutBadge shortcut={snippet.shortcut} />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-neutral-800 p-2">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            createSnippet();
            setView("snippets");
          }}
        >
          + New snippet
        </Button>
      </div>
    </aside>
  );
}
