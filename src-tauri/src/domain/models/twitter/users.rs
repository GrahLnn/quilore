use super::asset::{Asset, AssetType, DbAsset};
use crate::database::enums::table::Table;
use crate::database::{Crud, HasId};
use crate::domain::models::meta::GlobalVal;
use crate::domain::models::twitter::asset::FullAssetPath;
use crate::enums::platform::Platform;
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
        let url = json
            .pointer("/profile_image_url_https")?
            .as_str()?
            .to_string();
        let name = Url::parse(&url).ok()?.path_segments()?.last()?.to_string();

        let path = FullAssetPath(
            GlobalVal::get_save_dir()?
                .join(AssetType::Avatar.as_str())
                .join(name.clone()),
        );
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
            id: json.pointer("/screen_name")?.as_str()?.to_string(),
            name: json.pointer("/name")?.as_str()?.to_string(),
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
            avatar: Asset::get(self.avatar).await?,
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
