use std::sync::mpsc;
use std::thread;
use std::time::Duration;

use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;

/// How long to wait after simulating the paste keystroke before restoring
/// the user's previous clipboard contents. Long enough for the target
/// application to have consumed the paste in the common case; this is a
/// timed guess; there is no signal we can wait on to know the paste
/// actually landed. See the architecture notes on this trade-off.
const RESTORE_DELAY: Duration = Duration::from_millis(300);

/// Copies `content` to the clipboard, simulates the OS paste shortcut
/// (Cmd+V on macOS) so it lands in whatever application currently has
/// focus (pressing a global shortcut does not steal focus from it), then
/// restores the clipboard to whatever it held before.
///
/// The clipboard read/write happens on a background thread:
/// `tauri-plugin-clipboard-manager` explicitly warns against doing that on
/// the main thread (risk of deadlock on Linux), and the restore delay must
/// not block the global-shortcut event dispatch.
///
/// On macOS, simulating a keystroke requires QuickPaste to be granted
/// Accessibility permission (System Settings → Privacy & Security →
/// Accessibility). Without it, this silently does nothing — macOS doesn't
/// surface a Rust-level error for a denied synthetic event, it just drops
/// it. There's no reliable way to detect that from here; it needs to be
/// communicated to the user directly (tracked as Phase 8 polish).
pub fn paste_snippet(app: &AppHandle, content: String) {
    let app = app.clone();
    thread::spawn(move || {
        let previous_text = app.clipboard().read_text().ok();

        if let Err(err) = app.clipboard().write_text(content) {
            eprintln!("quickpaste: failed to set clipboard: {err}");
            return;
        }

        if let Err(err) = simulate_paste_keystroke(&app) {
            eprintln!("quickpaste: failed to simulate paste keystroke: {err}");
        }

        thread::sleep(RESTORE_DELAY);

        // If the clipboard held something other than text (an image, for
        // example), `previous_text` is `None` and we deliberately leave our
        // snippet on the clipboard rather than guessing how to restore it.
        if let Some(previous) = previous_text {
            if let Err(err) = app.clipboard().write_text(previous) {
                eprintln!("quickpaste: failed to restore clipboard: {err}");
            }
        }
    });
}

/// Hops onto the main thread to press the paste combo, and blocks this
/// (background) thread until it's done.
///
/// This isn't optional on macOS: confirmed via a real crash log, enigo's
/// `Key::Unicode` handling there resolves the current keyboard layout
/// through Carbon's Text Services Manager, which is guarded by an internal
/// `dispatch_assert_queue` — calling it off the main thread aborts the
/// whole process (EXC_BREAKPOINT), it doesn't just fail gracefully. Since
/// `paste_snippet` runs on a background thread, the keystroke itself has to
/// be explicitly dispatched back to the main thread.
fn simulate_paste_keystroke(app: &AppHandle) -> Result<(), String> {
    let (tx, rx) = mpsc::channel();

    app.run_on_main_thread(move || {
        let _ = tx.send(press_paste_combo());
    })
    .map_err(|e| e.to_string())?;

    rx.recv().map_err(|e| e.to_string())?
}

#[cfg(target_os = "macos")]
fn press_paste_combo() -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    // enigo's macOS backend has no named `Key::V` — letters are entered via
    // `Key::Unicode` there, unlike the Windows/Linux backends.
    enigo
        .key(Key::Meta, Direction::Press)
        .map_err(|e| e.to_string())?;
    enigo
        .key(Key::Unicode('v'), Direction::Click)
        .map_err(|e| e.to_string())?;
    enigo
        .key(Key::Meta, Direction::Release)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(not(target_os = "macos"))]
fn press_paste_combo() -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    enigo
        .key(Key::Control, Direction::Press)
        .map_err(|e| e.to_string())?;
    enigo
        .key(Key::V, Direction::Click)
        .map_err(|e| e.to_string())?;
    enigo
        .key(Key::Control, Direction::Release)
        .map_err(|e| e.to_string())?;
    Ok(())
}
