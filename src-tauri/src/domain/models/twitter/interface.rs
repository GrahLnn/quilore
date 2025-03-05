use crate::utils::serialize::i64_from_string_or_number;
use serde::{Deserialize, Serialize};
use specta::Type;

use super::like::LikedPost;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct LikedChunk {
    #[serde(deserialize_with = "i64_from_string_or_number")]
    #[specta(type = String)]
    pub cursor: i64,
    pub data: Vec<LikedPost>,
}
