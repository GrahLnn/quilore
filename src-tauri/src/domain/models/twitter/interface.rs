use crate::utils::serialize::into_u32_from_string_or_number;
use serde::{Deserialize, Serialize};
use specta::Type;

use super::like::LikedPost;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct LikedChunk {
    #[serde(deserialize_with = "into_u32_from_string_or_number")]
    pub cursor: u32,
    pub data: Vec<LikedPost>,
}

#[tauri::command]
#[specta::specta]
pub async fn take_post_chunk(cursor: Option<u32>) -> Result<LikedChunk, String> {
    let data = LikedPost::select_pagin(200, cursor)
        .await
        .map_err(|e| e.to_string())?;
    let cursor = data
        .last()
        .map(|p| p.sortidx)
        .ok_or_else(|| "No data found".to_string())?;
    Ok(LikedChunk { cursor, data })
}
