use std::sync::{Arc, LazyLock};

use super::scheduler::Status;
use crate::database::enums::table::Table;
use crate::database::{Crud, HasId};
use crate::{impl_crud, impl_id};
use anyhow::{anyhow, Result};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use specta::Type;
use surrealdb::RecordId;
use tokio::sync::Semaphore;

use super::{handler, Schedulable};

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub enum TaskKind {
    AssetDownload,
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
        Task::delete_record(self.id).await?;
        Ok(())
    }
    async fn on_success(self) -> Result<()> {
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

    async fn handle(self) -> Result<()> {
        match self.kind {
            TaskKind::AssetDownload => {
                // 使用固定大小的线程池处理下载任务
                static DOWNLOAD_SEMAPHORE: LazyLock<Semaphore> =
                    LazyLock::new(|| Semaphore::new(10));

                // 获取信号量许可
                let _permit = DOWNLOAD_SEMAPHORE.acquire().await;

                // 执行下载任务
                handler::download_asset(self).await.map_err(|e| e.into())
            }
        }
    }
}
