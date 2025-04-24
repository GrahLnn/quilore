use crate::database::enums::table::Table;
use crate::database::{Crud, HasId, Result as DBResult};
use crate::utils::serialize::{i64_from_string_or_number, i64_to_string};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;
use surrealdb::RecordId;

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Eq, Type)]
pub enum UserKey {
    Twitter,
}

impl UserKey {
    pub fn as_str(self) -> &'static str {
        match self {
            UserKey::Twitter => "twitter",
        }
    }
    pub fn from_str(s: &str) -> Result<Self, String> {
        match s {
            "twitter" => Ok(UserKey::Twitter),
            _ => Err(format!("Unknown UserKey: {}", s)),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub enum UserKVValue {
    String(String),
    #[serde(serialize_with = "i64_to_string")]
    #[serde(deserialize_with = "i64_from_string_or_number")]
    Number(#[specta(type = String)] i64),
}

impl UserKVValue {
    pub fn into_string(self) -> String {
        match self {
            UserKVValue::String(s) => s,
            UserKVValue::Number(n) => n.to_string(),
        }
    }

    pub fn into_number(self) -> i64 {
        match self {
            UserKVValue::String(s) => s.parse::<i64>().unwrap_or(0),
            UserKVValue::Number(n) => n,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct UserKV {
    pub key: UserKey,
    pub value: UserKVValue,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbUserKV {
    pub id: RecordId,
    pub value: UserKVValue,
}

impl HasId for DbUserKV {
    fn id(&self) -> RecordId {
        self.id.clone()
    }
}

impl Crud for DbUserKV {
    const TABLE: Table = Table::UserKV;
}

impl DbUserKV {
    pub fn new<T: Into<UserKVValue>>(key: UserKey, value: T) -> Self {
        let id = DbUserKV::record_id(key.as_str());
        Self {
            id,
            value: value.into(),
        }
    }

    pub async fn get(key: UserKey) -> DBResult<Option<UserKVValue>> {
        match DbUserKV::select(key.as_str()).await {
            Ok(data) => Ok(Some(data.value)),
            Err(e) => {
                if e.to_string().contains("not found") {
                    Ok(None)
                } else {
                    Err(e.into())
                }
            }
        }
    }

    pub fn to_domain(self) -> Result<UserKV> {
        let key_str = self.id.key().to_string();
        let key = UserKey::from_str(&key_str)
            .map_err(|e| anyhow::anyhow!("Failed to parse UserKey: {}", e))?;

        Ok(UserKV {
            key,
            value: self.value,
        })
    }

    pub fn from_domain(kv: UserKV) -> Result<Self> {
        Ok(Self::new(kv.key, kv.value))
    }
}

impl From<String> for UserKVValue {
    fn from(s: String) -> Self {
        UserKVValue::String(s)
    }
}

impl From<&str> for UserKVValue {
    fn from(s: &str) -> Self {
        UserKVValue::String(s.to_string())
    }
}

impl From<i64> for UserKVValue {
    fn from(n: i64) -> Self {
        UserKVValue::Number(n)
    }
}

impl From<i32> for UserKVValue {
    fn from(n: i32) -> Self {
        UserKVValue::Number(n as i64)
    }
}

#[tauri::command]
#[specta::specta]
pub async fn upsert_userkv(key: UserKey, value: &str) -> DBResult<()> {
    DbUserKV::from_domain(UserKV {
        key,
        value: value.into(),
    })?
    .upsert()
    .await?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn get_userkv_value(key: UserKey) -> DBResult<Option<String>> {
    DbUserKV::get(key).await.map(|v| v.map(|v| v.into_string()))
}
