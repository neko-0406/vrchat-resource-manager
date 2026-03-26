use sqlx::{sqlite::SqliteConnectOptions, Pool, Sqlite, SqlitePool};
use std::fs;
use tauri::AppHandle;
use tauri::Manager;

pub async fn init_db(app_handle: &AppHandle) -> Result<Pool<Sqlite>, Box<dyn std::error::Error>> {
    let mut db_path = app_handle
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");

    if !db_path.exists() {
        fs::create_dir_all(&db_path)?;
    }

    db_path.push("database.db");
    
    // SQLite接続オプションの設定
    let connect_options = SqliteConnectOptions::new()
        .filename(db_path)
        .create_if_missing(true);

    // 接続プールの作成
    let pool = SqlitePool::connect_with(connect_options).await?;

    // マイグレーションの実行
    // `migrations` フォルダにある .sql ファイルを適用する
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    Ok(pool)
}
