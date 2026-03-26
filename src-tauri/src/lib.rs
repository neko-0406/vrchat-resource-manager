mod app_setting;
use crate::app_setting::AppSetting;
use std::sync::Mutex;
use tauri::{Manager, State};

pub struct AppState {
    pub config: Mutex<AppSetting>,
}

#[tauri::command]
fn get_config(state: State<'_, AppState>) -> AppSetting {
    let config = state.config.lock().unwrap();
    config.clone()
}

#[tauri::command]
fn save_config(state: State<'_, AppState>, config: AppSetting) {
    let mut state_config = state.config.lock().unwrap();
    *state_config = config;
    // 本来はここでファイル保存も行う
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            config: Mutex::new(AppSetting::default()),
        })
        .invoke_handler(tauri::generate_handler![get_config, save_config])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
