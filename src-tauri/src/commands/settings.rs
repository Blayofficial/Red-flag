use tauri::AppHandle;
use tauri_plugin_autostart::ManagerExt;

use crate::domain::AppError;

#[tauri::command]
pub fn get_launch_on_startup(app: AppHandle) -> Result<bool, AppError> {
    app.autolaunch()
        .is_enabled()
        .map_err(|err| AppError::Internal(err.to_string()))
}

#[tauri::command]
pub fn set_launch_on_startup(app: AppHandle, enabled: bool) -> Result<(), AppError> {
    let manager = app.autolaunch();
    let result = if enabled {
        manager.enable()
    } else {
        manager.disable()
    };
    result.map_err(|err| AppError::Internal(err.to_string()))
}
