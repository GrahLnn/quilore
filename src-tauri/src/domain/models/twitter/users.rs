use super::asset::{Asset, AssetType, DbAsset};
use crate::database::{Crud, HasId};
use crate::domain::models::meta::GlobalVal;
use crate::enums::platform::Platform;
use crate::{database::enums::table::Table, utils::json_path};
use crate::{impl_crud, impl_id};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;
use surrealdb::RecordId;
use url::Url;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct User {
    #[serde(rename = "screen_name")]
    pub id: String,
    pub name: String,
    pub avatar: Asset,
}

impl User {
    pub fn from_api(json: &serde_json::Value) -> Option<Self> {
        let url = json_path::get_string(json, "profile_image_url_https")?;
        let name = Url::parse(&url).ok()?.path_segments()?.last()?.to_string();
        let base_path = GlobalVal::get_save_dir()?;
        let path = base_path
            .join("avatar")
            .join(name.clone())
            .to_string_lossy()
            .to_string();
        let avatar = Asset {
            url,
            path,
            name,
            downloaded: false,
            ty: AssetType::Avatar,
            plat: Platform::Twitter,
            available: false,
        };
        Some(Self {
            id: json_path::get_string(json, "screen_name")?,
            name: json_path::get_string(json, "name")?,
            avatar,
        })
    }
    pub fn into_db(self) -> DbUser {
        DbUser::from_domain(self)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbUser {
    pub id: RecordId,
    pub name: String,
    pub avatar: RecordId,
}

impl_crud!(DbUser, Table::User);
impl_id!(DbUser, id);

impl DbUser {
    pub async fn into_domain(self) -> Result<User> {
        Ok(User {
            id: self.id.key().to_string(),
            name: self.name,
            avatar: DbAsset::get(self.avatar).await?,
        })
    }

    pub fn from_domain(user: User) -> Self {
        Self {
            id: DbUser::record_id(user.id.as_str()),
            name: user.name,
            avatar: DbAsset::from_domain(user.avatar).id,
        }
    }

    pub async fn get(id: RecordId) -> Result<User> {
        let data: DbUser = DbUser::select_record(id).await?;
        data.into_domain().await
    }
}
