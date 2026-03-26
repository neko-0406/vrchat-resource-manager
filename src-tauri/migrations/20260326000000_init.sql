-- アセット本体
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    original_url TEXT,
    thumbnail_base64 TEXT,
    version TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ショップ管理
CREATE TABLE IF NOT EXISTS shops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- アセットとショップの紐付け
CREATE TABLE IF NOT EXISTS asset_shops (
    asset_id TEXT NOT NULL,
    shop_id INTEGER NOT NULL,
    PRIMARY KEY (asset_id, shop_id),
    FOREIGN KEY (asset_id) REFERENCES assets (id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shops (id) ON DELETE CASCADE
);

-- ファイル管理
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL,
    file_name TEXT
);

-- アセットとファイルの紐付け
CREATE TABLE IF NOT EXISTS asset_files (
    asset_id TEXT NOT NULL,
    file_id INTEGER NOT NULL,
    PRIMARY KEY (asset_id, file_id),
    FOREIGN KEY (asset_id) REFERENCES assets (id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
);

-- タグ管理
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- アセットとタグの紐付け
CREATE TABLE IF NOT EXISTS asset_tags (
    asset_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (asset_id, tag_id),
    FOREIGN KEY (asset_id) REFERENCES assets (id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
);
