import { Sidebar } from "./features/snippets/components/Sidebar";
import { SnippetEditor } from "./features/snippets/components/SnippetEditor";

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100">
      <Sidebar />
      <SnippetEditor />
    </div>
  );
}

export default App;
