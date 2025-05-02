use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
pub enum Platform {
    Twitter,
}

impl Platform {
    pub fn as_str(&self) -> &'static str {
        match self {
            Platform::Twitter => "twitter",
        }
    }
}