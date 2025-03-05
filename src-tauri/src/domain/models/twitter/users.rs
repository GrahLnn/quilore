use super::avatar::Avatar;
use crate::database::core::{Curd, HasId};
use crate::domain::enums::table::Table;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;
use surrealdb::RecordId;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct User {
    #[serde(rename = "screen_name")]
    pub id: String,
    pub name: String,
    pub avatar: Avatar,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbUser {
    pub id: RecordId,
    pub name: String,
    pub avatar: Avatar,
}

impl Curd for DbUser {
    const TABLE: &'static str = Table::User.as_str();
}

impl HasId for DbUser {
    fn id(&self) -> RecordId {
        self.id.clone()
    }
}

impl DbUser {
    pub async fn into_domain(self) -> Result<User> {
        Ok(User {
            id: self.id.key().to_string(),
            name: self.name,
            avatar: self.avatar,
        })
    }

    pub fn from_domain(user: User) -> Self {
        Self {
            id: DbUser::record_id(user.id.as_str()),
            name: user.name,
            avatar: user.avatar,
        }
    }

    pub async fn get(id: RecordId) -> Result<User> {
        let data: DbUser = DbUser::select_record(id).await?;
        data.into_domain().await
    }
}
