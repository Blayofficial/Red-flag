interface ShortcutBadgeProps {
  shortcut: string | null;
}

export function ShortcutBadge({ shortcut }: ShortcutBadgeProps) {
  if (!shortcut) {
    return <span className="text-xs text-neutral-500">No shortcut</span>;
  }

  const keys = shortcut.split("+");

  return (
    <span className="inline-flex items-center gap-0.5">
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[11px] font-medium text-neutral-300"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}
