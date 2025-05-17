use super::scheduler::Status;
use crate::database::enums::table::Table;
use crate::database::{Crud, HasId};
use crate::{impl_crud, impl_id};
use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use specta::Type;
use surrealdb::RecordId;

use super::{handler, Schedulable};

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub enum TaskKind {
    AssetDownload,
    AssetTransport,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: RecordId,
    pub tar: RecordId,
    pub kind: TaskKind,
    pub payload: Option<Value>,
    pub status: Status,
    pub result: Option<Value>,
    pub error: Option<String>,
    pub retry_count: u32,
    pub started_at: Option<DateTime<Utc>>,
    pub finished_at: Option<DateTime<Utc>>,
}

impl_crud!(Task, Table::Task);
impl_id!(Task, id);

impl Task {
    pub async fn get_tasks() -> Result<Vec<Task>> {
        Task::select_all().await.map_err(|e| e.into())
    }
}

#[async_trait::async_trait]
impl Schedulable for Task {
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
        let mut last_err = None;
        for _ in 0..5 {
            match Task::delete_record(self.id.clone()).await {
                Ok(_) => return Ok(()),
                Err(e) => last_err = Some(e),
            }
            tokio::time::sleep(std::time::Duration::from_millis(200)).await;
        }
        Err(last_err.unwrap_or_else(|| anyhow::anyhow!("未知错误")))
    }
    async fn on_success(self, _signal: Option<super::HandleSignal>) -> Result<()> {
        self.delete().await
    }

    async fn update_status(&self, status: Status, extra: Option<Value>) -> Result<()> {
        let mut data = json!({ "status": status });
        if let Some(e) = extra {
            for (k, v) in e.as_object().unwrap() {
                data[k] = v.clone();
            }
        }
        Task::merge(self.id.clone(), data).await?;
        Ok(())
    }

    async fn load_pending() -> Result<Vec<Self>> {
        Task::get_tasks().await
    }

    async fn handle(self) -> Result<Option<super::HandleSignal>> {
        match self.kind {
            TaskKind::AssetDownload => handler::download_asset(self).await.map_err(|e| e.into()),
            TaskKind::AssetTransport => handler::transport_asset(self).await.map_err(|e| e.into()),
        }
    }
}
