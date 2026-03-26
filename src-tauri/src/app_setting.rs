use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct AppSetting {
    pub asset_data_folder: String,
}