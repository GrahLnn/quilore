use anyhow::anyhow;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;
use surrealdb::RecordId;

use crate::database::enums::table::Table;
use crate::database::{Crud, HasId};
use crate::domain::models::meta::GlobalVal;
use crate::domain::platform::{scheduler, Task, TaskKind};
use crate::enums::platform::Platform;
use crate::{impl_crud, impl_id};

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub enum AssetType {
    Avatar,
    Media,
    Thumb,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct Asset {
    pub ty: AssetType,
    pub plat: Platform,
    pub url: String,
    pub name: String,
    pub path: String,
    pub downloaded: bool,
    pub available: bool,
}

impl Asset {
    pub fn into_db(self) -> DbAsset {
        DbAsset::from_domain(self)
    }
}

/// 持久化到 SurrealDB 的 Asset
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbAsset {
    pub id: RecordId,
    pub ty: AssetType,
    pub plat: Platform,
    pub url: String,
    pub name: String,
    pub path: String,
    pub downloaded: bool,
    pub available: bool,
}

impl_crud!(DbAsset, Table::Asset);
impl_id!(DbAsset, id);

impl DbAsset {
    pub fn into_domain(self) -> Asset {
        Asset {
            ty: self.ty,
            url: self.url,
            name: self.name,
            path: self.path,
            plat: self.plat,
            downloaded: self.downloaded,
            available: self.available,
        }
    }
    pub fn from_domain(asset: Asset) -> Self {
        Self {
            id: DbAsset::record_id(asset.url.as_str()),
            ty: asset.ty,
            url: asset.url,
            name: asset.name,
            path: asset.path,
            plat: asset.plat,
            downloaded: asset.downloaded,
            available: asset.available,
        }
    }
    pub async fn get(id: RecordId) -> Result<Asset> {
        let data: DbAsset = DbAsset::select_record(id).await?;
        Ok(data.into_domain())
    }
    pub fn into_task(self) -> Task {
        Task {
            id: Task::record_id(self.id.key().to_owned()),
            tar: self.id,
            kind: TaskKind::AssetDownload,
            payload: None,
            status: scheduler::Status::Pending,
            result: None,
            error: None,
            retry_count: 0,
            started_at: None,
            finished_at: None,
        }
    }
}

pub fn build_local_path(asset: &Asset) -> Result<String> {
    let base_path = GlobalVal::get_save_dir().ok_or_else(|| anyhow!("保存目录未设置"))?;
    let subfolder = match asset.ty {
        AssetType::Avatar => "avatar",
        AssetType::Media => "media",
        AssetType::Thumb => "thumb",
    };
    let save_path = base_path.join(subfolder).join(asset.name.clone());
    Ok(save_path.to_string_lossy().to_string())
}
