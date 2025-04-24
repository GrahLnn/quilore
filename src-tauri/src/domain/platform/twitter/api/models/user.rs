use serde::{Deserialize, Serialize};
use specta::Type;
use serde_json::Value;

/// 用户模型
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct User {
    /// 用户创建时间
    pub created_at: String,

    /// 用户描述
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// 粉丝数量
    pub followers_count: u32,

    /// 关注数量
    pub followings_count: u32,

    /// 用户全名
    pub full_name: String,

    /// 用户ID
    pub id: String,

    /// 是否已验证
    pub is_verified: bool,

    /// 点赞数量
    pub like_count: u32,

    /// 用户位置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<String>,

    /// 置顶推文ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pinned_tweet: Option<String>,

    /// 个人资料横幅图片URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub profile_banner: Option<String>,

    /// 个人资料图片URL
    pub profile_image: String,

    /// 推文数量
    pub statuses_count: u32,

    /// 用户名
    pub user_name: String,
}

impl User {
    /// 从JSON数据中提取用户列表
    pub fn list(response: &Value) -> Vec<Self> {
        let users = Vec::new();

        // 这里应该实现从Twitter API响应中提取用户列表的逻辑
        // 暂时返回空列表，后续实现

        users
    }

    /// 将自身转换为JSON
    pub fn to_json(&self) -> Value {
        serde_json::to_value(self).unwrap_or(Value::Null)
    }
}
