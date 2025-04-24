#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Table {
    LikedPost,
    Media,
    Post,
    Reply,
    User,
    Meta,
    UserKV,

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
        }
    }
}
