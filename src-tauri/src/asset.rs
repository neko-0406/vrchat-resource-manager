use serde::Deserialize;
use tauri::State;
use uuid::Uuid;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct AssetRegisterRequest {
    pub name: String,
    pub description: String,
    pub shop_name: String,
    pub category: String,
    pub version: String,
    pub original_url: String,
    pub thumbnail_base64: Option<String>,
    pub tags: Vec<String>,
    pub file_paths: Vec<String>,
}

#[tauri::command]
pub async fn register_asset(
    state: State<'_, AppState>,
    request: AssetRegisterRequest,
) -> Result<String, String> {
    let mut tx = state.db.begin().await.map_err(|e| e.to_string())?;

    // 1. アセットIDの生成
    let asset_id = Uuid::new_v4().to_string();

    // 2. ショップの処理 (存在しなければ挿入)
    sqlx::query("INSERT OR IGNORE INTO shops (name) VALUES (?)")
        .bind(&request.shop_name)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    let shop_row: (i64,) = sqlx::query_as("SELECT id FROM shops WHERE name = ?")
        .bind(&request.shop_name)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    // 3. アセット本体の挿入
    sqlx::query(
        "INSERT INTO assets (id, name, description, category, original_url, thumbnail_base64, version)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&asset_id)
    .bind(&request.name)
    .bind(&request.description)
    .bind(&request.category)
    .bind(&request.original_url)
    .bind(&request.thumbnail_base64)
    .bind(&request.version)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    // 4. アセットとショップの紐付け
    sqlx::query("INSERT INTO asset_shops (asset_id, shop_id) VALUES (?, ?)")
        .bind(&asset_id)
        .bind(shop_row.0)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    // 5. タグの処理
    for tag_name in request.tags {
        sqlx::query("INSERT OR IGNORE INTO tags (name) VALUES (?)")
            .bind(&tag_name)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        let tag_row: (i64,) = sqlx::query_as("SELECT id FROM tags WHERE name = ?")
            .bind(&tag_name)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query("INSERT INTO asset_tags (asset_id, tag_id) VALUES (?, ?)")
            .bind(&asset_id)
            .bind(tag_row.0)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    // 6. ファイルの処理
    for path in request.file_paths {
        let file_name = std::path::Path::new(&path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        let result = sqlx::query("INSERT INTO files (file_path, file_name) VALUES (?, ?)")
            .bind(&path)
            .bind(file_name)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        
        let file_id = result.last_insert_rowid();

        sqlx::query("INSERT INTO asset_files (asset_id, file_id) VALUES (?, ?)")
            .bind(&asset_id)
            .bind(file_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    // トランザクションのコミット
    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(asset_id)
}
