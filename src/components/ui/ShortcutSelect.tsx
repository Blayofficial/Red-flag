const ALT_SHORTCUTS = Array.from({ length: 9 }, (_, i) => `Alt+${i + 1}`);

interface ShortcutSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  /** Shortcuts already used by other snippets — shown but disabled. */
  takenShortcuts: string[];
}

export function ShortcutSelect({ value, onChange, takenShortcuts }: ShortcutSelectProps) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      className="w-44 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200 outline-none focus:border-neutral-700"
    >
      <option value="">No shortcut</option>
      {ALT_SHORTCUTS.map((shortcut) => (
        <option key={shortcut} value={shortcut} disabled={takenShortcuts.includes(shortcut)}>
          {shortcut}
          {takenShortcuts.includes(shortcut) ? " (in use)" : ""}
        </option>
      ))}
    </select>
  );
}
