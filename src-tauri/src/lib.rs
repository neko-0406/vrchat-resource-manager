mod app_setting;
mod asset;
mod booth;
mod db;

use crate::app_setting::AppSetting;
use crate::asset::register_asset;
use crate::booth::scrape_booth;
use crate::db::init_db;
use sqlx::{Pool, Sqlite};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

pub struct AppState {
    pub config: Mutex<AppSetting>,
    pub db: Pool<Sqlite>,
}

#[tauri::command]
fn get_config(state: State<'_, AppState>) -> AppSetting {
    let config = state.config.lock().unwrap();
    config.clone()
}

#[tauri::command]
fn save_config(app: AppHandle, state: State<'_, AppState>, config: AppSetting) -> Result<(), String> {
    let mut state_config = state.config.lock().unwrap();
    *state_config = config.clone();

    // ファイルに保存
    config.save(&app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // DBの初期化（非同期実行を同期的に待機）
            let pool = tauri::async_runtime::block_on(async {
                init_db(&handle).await.expect("failed to initialize database")
            });

            // 起動時にファイルを読み込み
            let config = AppSetting::load(app.handle());
            app.manage(AppState {
                config: Mutex::new(config),
                db: pool,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_config, save_config, scrape_booth, register_asset])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

