import { create } from "zustand";
import type { Snippet } from "../lib/types";

// Phase 1: static placeholder data so the UI has something real to render.
// From Phase 3 onward this store is hydrated from the Rust backend (SQLite)
// via src/lib/api, and these placeholders go away.
const PLACEHOLDER_SNIPPETS: Snippet[] = [
  {
    id: "1",
    name: "Subject line",
    shortcut: "Alt+1",
    content: "Quick question about {Company}'s outbound process",
  },
  {
    id: "2",
    name: "Cold email",
    shortcut: "Alt+2",
    content:
      "Hi,\n\nJust wanted to reach out because I noticed your team is growing fast and wanted to see if there's a fit for what we're building.\n\nWorth a quick chat?",
  },
  {
    id: "3",
    name: "Calendly link",
    shortcut: "Alt+3",
    content: "https://calendly.com/your-name/15min",
  },
  {
    id: "4",
    name: "LinkedIn message",
    shortcut: "Alt+4",
    content:
      "Hey! Saw your profile and loved what you're doing at your company — would love to connect.",
  },
];

interface SnippetsState {
  snippets: Snippet[];
  selectedId: string | null;
  select: (id: string) => void;
}

export const useSnippetsStore = create<SnippetsState>((set) => ({
  snippets: PLACEHOLDER_SNIPPETS,
  selectedId: PLACEHOLDER_SNIPPETS[0].id,
  select: (id) => set({ selectedId: id }),
}));
