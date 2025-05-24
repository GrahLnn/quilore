use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Table {
    LikedPost,
    Media,
    Post,
    Reply,
    User,
    Meta,
    UserKV,
    Asset,
    Task,
    Status,
    Collection,
}

impl Table {
    pub const fn as_str(&self) -> &'static str {
        match self {
            Table::LikedPost => "liked_post",
            Table::Media => "media",
            Table::Post => "post",
            Table::Reply => "reply",
            Table::User => "user",
            Table::Meta => "metadata",
            Table::UserKV => "user_kv",
            Table::Asset => "asset",
            Table::Task => "task",
            Table::Status => "status",
            Table::Collection => "collection",
        }
    }
}

impl fmt::Display for Table {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}
