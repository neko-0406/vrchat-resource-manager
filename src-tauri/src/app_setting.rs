use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct AppSetting {
    pub asset_data_folder: String,
}

impl AppSetting {
    pub fn config_path(app_handle: &tauri::AppHandle) -> PathBuf {
        let mut path = app_handle
            .path()
            .app_data_dir()
            .expect("failed to get app data dir");

        // ディレクトリが存在しない場合は作成
        if !path.exists() {
            fs::create_dir_all(&path).ok();
        }

        path.push("settings.json");
        path
    }

    pub fn load(app_handle: &tauri::AppHandle) -> Self {
        let path = Self::config_path(app_handle);
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(setting) = serde_json::from_str(&content) {
                    return setting;
                }
            }
        }
        Self::default()
    }

    pub fn save(&self, app_handle: &tauri::AppHandle) -> Result<(), String> {
        let path = Self::config_path(app_handle);
        let content = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        fs::write(path, content).map_err(|e| e.to_string())?;
        Ok(())
    }
}
