use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct Avatar {
    pub url: String,
    pub path: String,
}
