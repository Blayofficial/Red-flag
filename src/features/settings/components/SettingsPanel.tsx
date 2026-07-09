import { useEffect, useState } from "react";
import * as settingsApi from "../../../lib/api/settings";
import { friendlyErrorMessage } from "../../../lib/types";

export function SettingsPanel() {
  const [launchOnStartup, setLaunchOnStartupState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsApi
      .getLaunchOnStartup()
      .then(setLaunchOnStartupState)
      .catch((err) => setError(friendlyErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function toggleLaunchOnStartup() {
    const next = !launchOnStartup;
    setSaving(true);
    setError(null);
    try {
      await settingsApi.setLaunchOnStartup(next);
      setLaunchOnStartupState(next);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <h1 className="text-lg font-semibold text-neutral-100">Settings</h1>

      {error && (
        <div className="rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">Startup</h2>
        <label className="flex items-center gap-3 text-sm text-neutral-200">
          <input
            type="checkbox"
            checked={launchOnStartup}
            disabled={loading || saving}
            onChange={toggleLaunchOnStartup}
            className="h-4 w-4 rounded border-neutral-700 bg-neutral-900"
          />
          Launch QuickPaste when you log in
        </label>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Shortcut modifier key
        </h2>
        <select
          value="option"
          disabled
          className="w-56 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200 outline-none disabled:opacity-70"
        >
          <option value="option">Option ⌥ (default)</option>
          <option value="cmd-option" disabled>
            Cmd+Option (coming soon)
          </option>
          <option value="custom" disabled>
            Custom combination (coming soon)
          </option>
        </select>
        <p className="text-xs text-neutral-500">
          Snippet shortcuts use Option+1 through Option+9 for now. More modifier options are
          planned.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Permissions
        </h2>
        <p className="text-xs text-neutral-500">
          QuickPaste needs Accessibility permission to paste into other apps. If shortcuts don't
          paste anything, open System Settings → Privacy &amp; Security → Accessibility and enable
          QuickPaste.
        </p>
      </section>
    </main>
  );
}
