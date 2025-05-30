use std::fmt;

pub trait TableName {
    fn table_name(&self) -> &str;
}

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
    ScrollCursor,
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
            Table::ScrollCursor => "scroll_cursor",
        }
    }
}

impl TableName for Table {
    fn table_name(&self) -> &str {
        self.as_str()
    }
}

impl fmt::Display for Table {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Rel {
    Collect,
}

impl Rel {
    pub const fn as_str(&self) -> &'static str {
        match self {
            Rel::Collect => "collect",
        }
    }
}

impl fmt::Display for Rel {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl TableName for Rel {
    fn table_name(&self) -> &str {
        self.as_str()
    }
}
