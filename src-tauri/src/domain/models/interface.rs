use serde::{Deserialize, Serialize};
use specta::Type;

use super::twitter::like::LikedPost;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct Chunk<T> {
    pub cursor: String,
    pub data: Vec<T>,
}

#[tauri::command]
#[specta::specta]
pub async fn take_post_chunk(cursor: Option<String>) -> Result<Chunk<LikedPost>, String> {
    let data = LikedPost::select_pagin(100, cursor.map(|c| c.parse::<u32>().unwrap()))
        .await
        .map_err(|e| e.to_string())?;
    let cursor = data
        .last()
        .map(|p| p.sortidx.to_string())
        .ok_or_else(|| "No data found".to_string())?;
    Ok(Chunk { cursor, data })
}

#[tauri::command]
#[specta::specta]
pub async fn check_has_data() -> Result<bool, String> {
    let data = LikedPost::select_pagin(1, None)
        .await
        .map_err(|e| e.to_string())?;
    Ok(!data.is_empty())
}
