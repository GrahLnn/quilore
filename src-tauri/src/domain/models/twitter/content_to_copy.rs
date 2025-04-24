use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct ContentToCopy {
    pub author: String,
    pub content: String,
    pub media: Option<Vec<String>>,
    pub quote: Option<QuoteContentToCopy>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct QuoteContentToCopy {
    pub author: String,
    pub content: String,
    pub media: Option<Vec<String>>,
}
