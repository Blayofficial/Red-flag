import { create } from "zustand";

export type View = "snippets" | "settings";

interface UiState {
  view: View;
  setView: (view: View) => void;
}

export const useUiStore = create<UiState>((set) => ({
  view: "snippets",
  setView: (view) => set({ view }),
}));
