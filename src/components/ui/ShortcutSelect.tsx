// macOS's "Alt" key is physically labeled Option (⌥). The string sent to
// the backend is still "Option+1" etc. — the Rust side's shortcut parser
// (global-hotkey) accepts "OPTION" as an alias for the Alt modifier bit.
const OPTION_SHORTCUTS = Array.from({ length: 9 }, (_, i) => `Option+${i + 1}`);

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
      {OPTION_SHORTCUTS.map((shortcut) => (
        <option key={shortcut} value={shortcut} disabled={takenShortcuts.includes(shortcut)}>
          {shortcut}
          {takenShortcuts.includes(shortcut) ? " (in use)" : ""}
        </option>
      ))}
    </select>
  );
}
