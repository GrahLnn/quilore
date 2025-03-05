use crate::database::core::{Curd, HasId};
use crate::domain::enums::meta::MetaKey;
use crate::domain::enums::table::Table;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use surrealdb::RecordId;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(untagged)]
pub enum MetaValue {
    String(String),
    Number(i64),
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

#[derive(Debug, Clone)]
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

impl Curd for DbMeta {
    const TABLE: &'static str = Table::Meta.as_str();
}

impl DbMeta {
    pub fn new<T: Into<MetaValue>>(id: String, v: T) -> Self {
        let id = DbMeta::record_id(id);
        Self { id, v: v.into() }
    }

    pub async fn get(id: String) -> Result<Option<MetaValue>> {
        match DbMeta::select(id).await {
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

    pub async fn set<T: Into<MetaValue>>(id: &str, v: T) -> Result<()> {
        let data = DbMeta::new(id.to_string(), v);
        DbMeta::create_or_update(id, data).await?;
        Ok(())
    }

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
