import { invoke } from "@tauri-apps/api/core";

export function getLaunchOnStartup(): Promise<boolean> {
  return invoke("get_launch_on_startup");
}

export function setLaunchOnStartup(enabled: boolean): Promise<void> {
  return invoke("set_launch_on_startup", { enabled });
}
