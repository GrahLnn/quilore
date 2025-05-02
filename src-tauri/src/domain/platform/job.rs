use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use surrealdb::RecordId;

use crate::database::enums::table::Table;
use crate::database::{Crud, HasId};
use crate::{impl_crud, impl_id};

use super::api::user::process_likes_chunk;
use super::Schedulable;
use super::Status;

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum Mission {
    ScanLikes,
}

impl Mission {
    pub fn as_str(self) -> &'static str {
        match self {
            Mission::ScanLikes => "scan_likes",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Job {
    pub id: RecordId,
    pub mission: Mission,
    pub status: Status,
    pub params: Value,
    pub error: Option<String>,
    pub retry_count: u32,
    pub max_retry_count: u32,
    pub started_at: Option<DateTime<Utc>>,
    pub finished_at: Option<DateTime<Utc>>,
}

impl_crud!(Job, Table::Status);
impl_id!(Job, id);

impl Job {
    pub async fn get_jobs() -> anyhow::Result<Vec<Self>> {
        Job::select_all().await.map_err(|e| e.into())
    }

    pub async fn update_params(&self, params: Value) -> anyhow::Result<()> {
        Job::merge(self.id.clone(), json!({ "params": params })).await?;
        Ok(())
    }
}

#[async_trait::async_trait]
impl Schedulable for Job {
    fn id(&self) -> RecordId {
        self.id.clone()
    }
    fn status(&self) -> Status {
        self.status.clone()
    }
    fn retry_count(&self) -> u32 {
        self.retry_count
    }
    async fn delete(self) -> Result<()> {
        Job::delete_record(self.id).await?;
        Ok(())
    }
    async fn on_success(self) -> Result<()> {
        let state = self
            .params
            .get("is_end")
            .and_then(Value::as_bool)
            .unwrap_or(false);
        match state {
            true => self.delete().await,
            false => {
                self.update_status(Status::Succeeded, Some(json!({"finished_at": Utc::now()})))
                    .await
            }
        }
    }
    async fn update_status(&self, status: Status, extra: Option<Value>) -> anyhow::Result<()> {
        let mut data = json!({ "status": status });
        if let Some(e) = extra {
            for (k, v) in e.as_object().unwrap() {
                data[k] = v.clone();
            }
        }
        Job::merge(self.id.clone(), data).await?;
        Ok(())
    }
    async fn handle(self) -> anyhow::Result<()> {
        match self.mission {
            Mission::ScanLikes => process_likes_chunk(self).await,
        }
    }
    async fn load_pending() -> anyhow::Result<Vec<Self>> {
        Job::get_jobs().await
    }
}
