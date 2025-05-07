use crate::database::enums::meta::MetaKey;
use crate::database::enums::table::Table;
use crate::database::{Crud, HasId};
use crate::utils::serialize::{i64_from_string_or_number, i64_to_string};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::PathBuf;
use std::sync::{LazyLock, RwLock};
use surrealdb::RecordId;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub enum MetaValue {
    String(String),
    #[serde(serialize_with = "i64_to_string")]
    #[serde(deserialize_with = "i64_from_string_or_number")]
    Number(#[specta(type = String)] i64),
}

impl MetaValue {
    pub fn into_string(self) -> String {
        match self {
            MetaValue::String(s) => s,
            MetaValue::Number(n) => n.to_string(),
        }
    }

    pub fn into_number(self) -> i64 {
        match self {
            MetaValue::String(s) => s.parse::<i64>().unwrap(),
            MetaValue::Number(n) => n,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct Meta {
    pub id: MetaKey,
    pub v: MetaValue,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbMeta {
    pub id: RecordId,
    pub v: MetaValue,
}

impl HasId for DbMeta {
    fn id(&self) -> RecordId {
        self.id.clone()
    }
}

impl Crud for DbMeta {
    const TABLE: Table = Table::Meta;
}

impl DbMeta {
    pub fn new<T: Into<MetaValue>>(id: String, v: T) -> Self {
        let id = DbMeta::record_id(id);
        Self { id, v: v.into() }
    }

    pub async fn get(id: MetaKey) -> Result<Option<MetaValue>> {
        match DbMeta::select(id.as_str().to_string()).await {
            Ok(data) => Ok(Some(data.v)),
            Err(e) => {
                if e.to_string().contains("not found") {
                    Ok(None)
                } else {
                    Err(e.into())
                }
            }
        }
    }

    // pub async fn set<T: Into<MetaValue>>(id: &str, v: T) -> Result<()> {
    //     let data = DbMeta::new(id.to_string(), v);
    //     DbMeta::create_or_update(id, data).await?;
    //     Ok(())
    // }

    pub fn to_domain(self) -> Result<Meta> {
        let key_str = self.id.key().to_string();
        let id = MetaKey::from_str(&key_str)
            .map_err(|e| anyhow::anyhow!("Failed to parse MetaKey: {}", e))?;

        Ok(Meta { id, v: self.v })
    }

    pub fn from_domain(meta: Meta) -> Result<Self> {
        Ok(Self::new(meta.id.as_str().to_string(), meta.v))
    }
}

impl From<String> for MetaValue {
    fn from(s: String) -> Self {
        MetaValue::String(s)
    }
}

impl From<&str> for MetaValue {
    fn from(s: &str) -> Self {
        MetaValue::String(s.to_string())
    }
}

impl From<i64> for MetaValue {
    fn from(n: i64) -> Self {
        MetaValue::Number(n)
    }
}

impl From<i32> for MetaValue {
    fn from(n: i32) -> Self {
        MetaValue::Number(n as i64)
    }
}

#[tauri::command]
#[specta::specta]
pub async fn upsert_metakv(id: MetaKey, v: &str) -> Result<(), String> {
    DbMeta::from_domain(Meta { id, v: v.into() })
        .map_err(|e| e.to_string())?
        .upsert()
        .await
        .map_err(|e| e.to_string())?;
    GlobalVal::update().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn get_meta_value(id: MetaKey) -> Result<Option<MetaValue>, String> {
    DbMeta::get(id).await.map_err(|e| e.to_string())
}

static GLOBAL_VAL: LazyLock<RwLock<GlobalVal>> =
    LazyLock::new(|| RwLock::new(GlobalVal { save_dir: None }));

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct GlobalVal {
    pub save_dir: Option<PathBuf>,
}

impl GlobalVal {
    pub async fn init() -> Result<()> {
        let save_dir = DbMeta::get(MetaKey::SaveDir)
            .await?
            .map(|v| PathBuf::from(v.into_string()));
        let mut guard = GLOBAL_VAL.write().unwrap();
        guard.save_dir = save_dir;
        Ok(())
    }

    pub fn get_save_dir() -> Option<PathBuf> {
        GLOBAL_VAL.read().unwrap().save_dir.clone()
    }

    pub async fn update() -> Result<()> {
        let save_dir = DbMeta::get(MetaKey::SaveDir)
            .await?
            .map(|v| PathBuf::from(v.into_string()));
        let mut guard = GLOBAL_VAL.write().unwrap();
        guard.save_dir = save_dir;
        Ok(())
    }
}

#[tauri::command]
#[specta::specta]
pub async fn get_save_dir() -> Result<Option<String>, String> {
    Ok(GlobalVal::get_save_dir().map(|p| p.to_string_lossy().to_string()))
}
