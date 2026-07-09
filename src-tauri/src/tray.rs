use tauri::{
    menu::{Menu, MenuEvent, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

const MAIN_WINDOW_LABEL: &str = "main";
const OPEN_MENU_ID: &str = "open";
const QUIT_MENU_ID: &str = "quit";

/// Builds the tray icon and its menu (Open / Quit). Closing the main
/// window is intercepted separately (see `lib.rs`) to hide it instead of
/// exiting — this is what actually lets the tray icon do anything useful.
pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    let open_item = MenuItem::with_id(app, OPEN_MENU_ID, "Open", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, QUIT_MENU_ID, "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open_item, &quit_item])?;

    let icon = app
        .default_window_icon()
        .cloned()
        .expect("a default window icon is configured in tauri.conf.json");

    TrayIconBuilder::new()
        .icon(icon)
        .tooltip("QuickPaste")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(handle_menu_event)
        .on_tray_icon_event(handle_tray_icon_event)
        .build(app)?;

    Ok(())
}

fn handle_menu_event(app: &AppHandle, event: MenuEvent) {
    match event.id().0.as_str() {
        OPEN_MENU_ID => show_main_window(app),
        QUIT_MENU_ID => app.exit(0),
        _ => {}
    }
}

fn handle_tray_icon_event(tray: &TrayIcon, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
    } = event
    {
        show_main_window(tray.app_handle());
    }
}

fn show_main_window(app: &AppHandle) {
    let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
        return;
    };
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
}
