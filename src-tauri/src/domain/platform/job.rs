use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use specta::Type;
use surrealdb::RecordId;
use tauri_specta::Event;

use crate::database::enums::table::Table;
use crate::database::{Crud, HasId};
use crate::domain::platform::Scheduler;
use crate::{impl_crud, impl_id};

use super::api::user::process_likes_chunk;
use super::Status;
use super::{HandleSignal, Schedulable};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, specta::Type)]
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
    pub end_band: Vec<RecordId>,
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

#[derive(Serialize, Deserialize, Debug, Clone, Type, Event)]
pub struct ScanLikesIncEvent {
    need_refresh: bool,
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
    async fn on_success(self, signal: Option<HandleSignal>) -> Result<()> {
        let state = signal
            .map(|s| s.value)
            .and_then(|v| v.get("is_end").cloned())
            .map(|v| v.as_bool().unwrap_or(false))
            .unwrap();
        dbg!(state);
        match state {
            true => {
                if !self.end_band.is_empty() && self.mission == Mission::ScanLikes {
                    print!("emit need_refresh");
                    let app = Scheduler::<Job>::get()?.app.clone();
                    ScanLikesIncEvent { need_refresh: true }
                        .emit(&app)
                        .map_err(|e| anyhow!("emit ScanLikesIncEvent 失败: {}", e))?;
                }

                self.delete().await
            }
            false => {
                self.update_status(Status::Succeeded, Some(json!({"finished_at": Utc::now()})))
                    .await
            }
        }
    }
    async fn update_status(&self, status: Status, extra: Option<Value>) -> Result<()> {
        let mut data = json!({ "status": status });
        if let Some(e) = extra {
            for (k, v) in e.as_object().unwrap() {
                data[k] = v.clone();
            }
        }
        Job::merge(self.id.clone(), data).await?;
        Ok(())
    }
    async fn handle(self) -> Result<Option<HandleSignal>> {
        match self.mission {
            Mission::ScanLikes => process_likes_chunk(self).await,
        }
    }
    async fn load_pending() -> Result<Vec<Self>> {
        Job::get_jobs().await
    }
}
