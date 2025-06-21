use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::ops::Deref;
use std::path::{Path, PathBuf};
use surrealdb::RecordId;

use crate::database::enums::table::Table;
use crate::database::{Crud, HasId};
use crate::domain::models::meta::GlobalVal;
use crate::domain::platform::{scheduler, Task, TaskKind};
use crate::enums::platform::Platform;
use crate::{impl_crud, impl_id};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct FullAssetPath(pub PathBuf);

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct RelAssetPath(pub PathBuf);

impl Deref for FullAssetPath {
    type Target = PathBuf;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl AsRef<Path> for FullAssetPath {
    fn as_ref(&self) -> &Path {
        self.0.as_path()
    }
}

impl Deref for RelAssetPath {
    type Target = PathBuf;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl FullAssetPath {
    pub fn to_rel(&self) -> RelAssetPath {
        let base = GlobalVal::get_save_dir().unwrap();
        RelAssetPath(self.0.strip_prefix(&base).unwrap_or(&self.0).to_path_buf())
    }
}
impl RelAssetPath {
    pub fn to_full(&self) -> FullAssetPath {
        let base = GlobalVal::get_save_dir().unwrap();
        FullAssetPath(base.join(&self.0))
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Type, PartialEq, Eq)]
pub enum AssetType {
    Avatar,
    Media,
    Thumb,
}

impl AssetType {
    pub const fn as_str(&self) -> &'static str {
        match self {
            AssetType::Avatar => "avatar",
            AssetType::Media => "media",
            AssetType::Thumb => "thumb",
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct Asset {
    pub ty: AssetType,
    pub plat: Platform,
    pub url: String,
    pub name: String,
    pub path: FullAssetPath,
    pub downloaded: bool,
    pub available: bool,
}

impl Asset {
    pub fn into_db(self) -> DbAsset {
        DbAsset::from_domain(self)
    }
    pub async fn get(id: RecordId) -> Result<Self> {
        DbAsset::get(id).await.map(|db| db.into_domain())
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
    pub path: RelAssetPath,
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
            path: self.path.to_full(),
            plat: self.plat,
            downloaded: self.downloaded,
            available: self.available,
        }
    }
    pub fn from_domain(asset: Asset) -> Self {
        Self {
            id: DbAsset::record_id(format!("{}-{}", asset.ty.as_str(), asset.name).as_str()),
            ty: asset.ty,
            url: asset.url,
            name: asset.name,
            path: asset.path.to_rel(),
            plat: asset.plat,
            downloaded: asset.downloaded,
            available: asset.available,
        }
    }
    pub async fn get(id: RecordId) -> Result<Self> {
        DbAsset::select_record(id).await
    }
    pub fn into_task(self, kind: TaskKind) -> Task {
        Task {
            id: Task::record_id(self.id.key().to_owned()),
            tar: self.id,
            kind,
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
