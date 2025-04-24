use super::avatar::Avatar;
use crate::{database::enums::table::Table, utils::json_path};
use crate::database::{Crud, HasId};
use crate::{impl_crud, impl_id};
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

impl User {
    pub fn from_json(json: &serde_json::Value) -> Option<Self> {
        Some(Self {
            id: json_path::get_string(json, "screen_name")?,
            name: json_path::get_string(json, "name")?,
            avatar: Avatar {
                url: json_path::get_string(json, "profile_image_url_https")?,
                path: "".to_string(),
            },
        })
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbUser {
    pub id: RecordId,
    pub name: String,
    pub avatar: Avatar,
}

impl_crud!(DbUser, Table::User);
impl_id!(DbUser, id);

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
