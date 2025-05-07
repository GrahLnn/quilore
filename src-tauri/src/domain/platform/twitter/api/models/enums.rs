use serde::{Deserialize, Serialize};
use specta::Type;

/// 媒体类型枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Type)]
pub enum MediaType {
    #[serde(rename = "photo")]
    Photo,
    #[serde(rename = "video")]
    Video,
    #[serde(rename = "gif")]
    Gif,
}

/// 基础数据类型枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Type)]
pub enum BaseType {
    #[serde(rename = "tweet")]
    Tweet,
    #[serde(rename = "user")]
    User,
    #[serde(rename = "notification")]
    Notification,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Type)]
pub enum EntriesType {
    TimelineAddEntries,
}
