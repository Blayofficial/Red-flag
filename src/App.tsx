import { useEffect } from "react";
import { Sidebar } from "./features/snippets/components/Sidebar";
import { SnippetEditor } from "./features/snippets/components/SnippetEditor";
import { useSnippetsStore } from "./store/snippetsStore";

function App() {
  const load = useSnippetsStore((s) => s.load);
  const status = useSnippetsStore((s) => s.status);
  const error = useSnippetsStore((s) => s.error);
  const clearError = useSnippetsStore((s) => s.clearError);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      {error && (
        <div className="flex items-center justify-between border-b border-red-900/50 bg-red-950/60 px-4 py-2 text-sm text-red-200">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-300 hover:text-red-100">
            Dismiss
          </button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {status === "loading" ? (
          <main className="flex flex-1 items-center justify-center text-sm text-neutral-500">
            Loading snippets…
          </main>
        ) : (
          <SnippetEditor />
        )}
      </div>
    </div>
  );
}

export default App;
