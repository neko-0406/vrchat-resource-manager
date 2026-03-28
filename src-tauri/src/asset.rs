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

#[derive(Debug, serde::Serialize)]
pub struct AssetResponse {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub original_url: Option<String>,
    pub thumbnail_base64: Option<String>,
    pub version: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub shop_name: Option<String>,
    pub tags: Vec<String>,
}

#[tauri::command]
pub async fn get_assets(state: State<'_, AppState>) -> Result<Vec<AssetResponse>, String> {
    let rows = sqlx::query(
        r#"
        SELECT 
            a.id, a.name, a.description, a.category, a.original_url, 
            a.thumbnail_base64, a.version, a.created_at, a.updated_at,
            s.name as shop_name,
            GROUP_CONCAT(t.name) as tags
        FROM assets a
        LEFT JOIN asset_shops ash ON a.id = ash.asset_id
        LEFT JOIN shops s ON ash.shop_id = s.id
        LEFT JOIN asset_tags at ON a.id = at.asset_id
        LEFT JOIN tags t ON at.tag_id = t.id
        GROUP BY a.id
        ORDER BY a.created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    let mut response = Vec::new();
    for row in rows {
        use sqlx::Row;
        let tags_str: Option<String> = row.get("tags");
        let tags = tags_str
            .map(|s| s.split(',').map(|t| t.to_string()).collect())
            .unwrap_or_else(Vec::new);

        response.push(AssetResponse {
            id: row.get("id"),
            name: row.get("name"),
            description: row.get("description"),
            category: row.get("category"),
            original_url: row.get("original_url"),
            thumbnail_base64: row.get("thumbnail_base64"),
            version: row.get("version"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            shop_name: row.get("shop_name"),
            tags,
        });
    }

    Ok(response)
}

#[tauri::command]
pub async fn open_asset_folder(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    asset_id: String,
) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;

    let base_path = {
        let config = state.config.lock().unwrap();
        config.asset_data_folder.clone()
    };

    if base_path.is_empty() {
        return Err("アセット保存先フォルダが設定されていません。".to_string());
    }

    let asset_dir = std::path::Path::new(&base_path).join(&asset_id);
    if !asset_dir.exists() {
        return Err("アセットのフォルダが見つかりません。".to_string());
    }

    let path_str = asset_dir.to_string_lossy().to_string();
    app.opener()
        .open_path(path_str, None::<String>)
        .map_err(|e| e.to_string())?;

    Ok(())
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
    let base_path = {
        let config = state.config.lock().unwrap();
        config.asset_data_folder.clone()
    };

    if base_path.is_empty() {
        return Err("アセット保存先フォルダが設定されていません。アプリ設定から設定してください。".to_string());
    }

    // アセットごとの保存ディレクトリ作成
    let asset_dir = std::path::Path::new(&base_path).join(&asset_id);
    if !asset_dir.exists() {
        std::fs::create_dir_all(&asset_dir).map_err(|e| e.to_string())?;
    }

    for path in request.file_paths {
        // コピー先ファイル名の生成 (UUID.zip)
        let file_uuid = Uuid::new_v4().to_string();
        let extension = std::path::Path::new(&path)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("zip");
        let new_file_name = format!("{}.{}", file_uuid, extension);
        let dest_path = asset_dir.join(&new_file_name);

        // 元のファイル名（表示用）
        let original_file_name = std::path::Path::new(&path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        // ファイルをコピー
        std::fs::copy(&path, &dest_path).map_err(|e| format!("ファイルのコピーに失敗しました: {}", e))?;

        // DBにはコピー後のフルパスと元のファイル名を保存
        let dest_path_str = dest_path.to_string_lossy().to_string();
        let result = sqlx::query("INSERT INTO files (file_path, file_name) VALUES (?, ?)")
            .bind(&dest_path_str)
            .bind(original_file_name)
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

#[tauri::command]
pub async fn delete_assets(
    state: State<'_, AppState>,
    asset_ids: Vec<String>,
) -> Result<(), String> {
    let mut tx = state.db.begin().await.map_err(|e| e.to_string())?;

    // 1. 設定から保存先フォルダを取得
    let base_path = {
        let config = state.config.lock().unwrap();
        config.asset_data_folder.clone()
    };

    for asset_id in &asset_ids {
        // 2. 関連するファイル情報の取得 (物理削除用)
        let files: Vec<(i64, String)> = sqlx::query_as(
            "SELECT f.id, f.file_path FROM files f 
             JOIN asset_files af ON f.id = af.file_id 
             WHERE af.asset_id = ?"
        )
        .bind(asset_id)
        .fetch_all(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        // 3. assets テーブルから削除 (ON DELETE CASCADE により中間テーブルも削除される)
        sqlx::query("DELETE FROM assets WHERE id = ?")
            .bind(asset_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        // 4. files テーブルからレコードを削除
        for (file_id, _) in &files {
            sqlx::query("DELETE FROM files WHERE id = ?")
                .bind(file_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }

        // 5. 物理フォルダの削除
        if !base_path.is_empty() {
            let asset_dir = std::path::Path::new(&base_path).join(asset_id);
            if asset_dir.exists() {
                std::fs::remove_dir_all(&asset_dir).map_err(|e| format!("フォルダの削除に失敗しました ({}): {}", asset_id, e))?;
            }
        }
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(())
}
