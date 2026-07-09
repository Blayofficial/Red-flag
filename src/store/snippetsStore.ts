import { create } from "zustand";
import * as api from "../lib/api/snippets";
import type { Snippet, SnippetUpdate } from "../lib/types";
import { friendlyErrorMessage } from "../lib/types";

interface SnippetsState {
  snippets: Snippet[];
  selectedId: string | null;
  status: "idle" | "loading" | "ready";
  error: string | null;

  load: () => Promise<void>;
  select: (id: string) => void;
  createSnippet: () => Promise<void>;
  saveSnippet: (id: string, input: SnippetUpdate) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
  duplicateSnippet: (id: string) => Promise<void>;
  clearError: () => void;
}

const NEW_SNIPPET_DEFAULTS = { name: "Untitled snippet", content: "", shortcut: null };

export const useSnippetsStore = create<SnippetsState>((set, get) => ({
  snippets: [],
  selectedId: null,
  status: "idle",
  error: null,

  load: async () => {
    set({ status: "loading", error: null });
    try {
      const snippets = await api.listSnippets();
      set({
        snippets,
        status: "ready",
        selectedId: snippets[0]?.id ?? null,
      });
    } catch (err) {
      set({ status: "ready", error: friendlyErrorMessage(err) });
    }
  },

  select: (id) => set({ selectedId: id }),

  createSnippet: async () => {
    try {
      const created = await api.createSnippet(NEW_SNIPPET_DEFAULTS);
      set({ snippets: [...get().snippets, created], selectedId: created.id, error: null });
    } catch (err) {
      set({ error: friendlyErrorMessage(err) });
    }
  },

  saveSnippet: async (id, input) => {
    try {
      const updated = await api.updateSnippet(id, input);
      set({
        snippets: get().snippets.map((s) => (s.id === id ? updated : s)),
        error: null,
      });
    } catch (err) {
      set({ error: friendlyErrorMessage(err) });
      throw err;
    }
  },

  deleteSnippet: async (id) => {
    try {
      await api.deleteSnippet(id);
      const remaining = get().snippets.filter((s) => s.id !== id);
      set({
        snippets: remaining,
        selectedId: get().selectedId === id ? remaining[0]?.id ?? null : get().selectedId,
        error: null,
      });
    } catch (err) {
      set({ error: friendlyErrorMessage(err) });
    }
  },

  duplicateSnippet: async (id) => {
    try {
      const copy = await api.duplicateSnippet(id);
      set({ snippets: [...get().snippets, copy], selectedId: copy.id, error: null });
    } catch (err) {
      set({ error: friendlyErrorMessage(err) });
    }
  },

  clearError: () => set({ error: null }),
}));
