use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
struct BoothImage {
    original: String,
}

#[derive(Debug, Deserialize)]
struct BoothShop {
    name: String,
}

#[derive(Debug, Deserialize)]
struct BoothCategory {
    name: String,
}

#[derive(Debug, Deserialize)]
struct BoothTag {
    name: String,
}

#[derive(Debug, Deserialize)]
struct BoothItemResponse {
    name: String,
    description: String,
    shop: BoothShop,
    category: BoothCategory,
    images: Vec<BoothImage>,
    tags: Vec<BoothTag>,
}

#[derive(Debug, Serialize)]
pub struct ScrapedBoothInfo {
    pub name: String,
    pub description: String,
    pub shop_name: String,
    pub category: String,
    pub thumbnail_base64: Option<String>,
    pub tags: Vec<String>,
}

#[tauri::command]
pub async fn scrape_booth(url: String) -> Result<ScrapedBoothInfo, String> {
    // 1. URLを .json 形式に変換
    let json_url = if url.ends_with(".json") {
        url.clone()
    } else {
        format!("{}.json", url.trim_end_matches('/'))
    };

    let client = reqwest::Client::new();

    // 2. BoothからJSONを取得
    let response = client
        .get(&json_url)
        .header("User-Agent", "VRChat-Resource-Manager (Tauri App)")
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json::<BoothItemResponse>()
        .await
        .map_err(|e| e.to_string())?;

    // 3. サムネイル画像をBase64に変換
    let mut thumbnail_base64 = None;
    if let Some(first_image) = response.images.first() {
        if let Ok(img_resp) = client.get(&first_image.original).send().await {
            if let Ok(bytes) = img_resp.bytes().await {
                thumbnail_base64 = Some(general_purpose::STANDARD.encode(bytes));
            }
        }
    }

    // 4. フロントエンド用の形式にマッピング
    Ok(ScrapedBoothInfo {
        name: response.name,
        description: response.description,
        shop_name: response.shop.name,
        category: response.category.name,
        thumbnail_base64,
        tags: response.tags.into_iter().map(|t| t.name).collect(),
    })
}
