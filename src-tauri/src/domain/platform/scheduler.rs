use anyhow::{anyhow, Result};
use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    sync::{Arc, LazyLock},
    time::Duration,
};

use chrono::Utc;
use surrealdb::RecordId;
use tauri::AppHandle;
use tokio::sync::{
    mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender},
    Semaphore,
};

use super::{job::Job, Task};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum Status {
    Pending,
    Running,
    Succeeded,
    Failed,
}

#[async_trait::async_trait]
pub trait Schedulable: Send + Sync + Clone + 'static {
    fn id(&self) -> RecordId;
    fn status(&self) -> Status;
    fn retry_count(&self) -> u32;
    async fn update_status(&self, status: Status, extra: Option<Value>) -> Result<()>;
    async fn handle(self) -> Result<()>;
    async fn load_pending() -> Result<Vec<Self>>;
    async fn delete(self) -> Result<()>;
    async fn on_success(self) -> Result<()>;
}

pub struct Scheduler<T: Schedulable> {
    tx: UnboundedSender<T>,
    pub app: AppHandle,
}

impl<T: Schedulable> Scheduler<T> {
    pub fn new(app: AppHandle) -> (Arc<Self>, UnboundedReceiver<T>) {
        let (tx, rx) = unbounded_channel::<T>();
        let sched = Arc::new(Self { tx, app });
        (sched, rx)
    }

    pub async fn start(self: Arc<Self>, mut rx: UnboundedReceiver<T>) {
        let tx = self.tx.clone();

        // 初始化：从数据库加载 Pending 任务
        let pending = T::load_pending().await.expect("加载 Pending 失败");
        for item in pending {
            if let Err(e) = tx.send(item) {
                tracing::error!("无法发送初始化任务: {}", e);
            }
        }

        // Worker loop
        tokio::spawn(async move {
            while let Some(item) = rx.recv().await {
                let tx_inner = tx.clone();
                tokio::spawn(async move {
                    static WORK_SEMA: LazyLock<Semaphore> = LazyLock::new(|| Semaphore::new(10));
                    let _permit = WORK_SEMA.acquire().await.unwrap();

                    item.update_status(Status::Running, None).await.ok();

                    match item.clone().handle().await {
                        Ok(()) => {
                            item.on_success().await.ok();
                        }
                        Err(err) => {
                            let rc = item.retry_count() + 1;
                            item.update_status(
                                Status::Failed,
                                Some(json!({"error": err.to_string(), "retry_count": rc})),
                            )
                            .await
                            .ok();

                            if rc < 5 {
                                tokio::time::sleep(Duration::from_secs(5)).await;
                                let _ = tx_inner.send(item);
                            }
                        }
                    }
                });
            }
        });
    }

    pub fn enqueue(&self, item: T) {
        let _ = self.tx.send(item);
    }
}

static TASK_SCHED: LazyLock<OnceCell<Arc<Scheduler<Task>>>> = LazyLock::new(|| OnceCell::new());
impl Scheduler<Task> {
    pub async fn init(app: AppHandle) -> anyhow::Result<Arc<Self>> {
        // ① 构造 Scheduler，得到 rx
        let (sched, rx) = Scheduler::<Task>::new(app.clone());
        // ② 立刻存到全局，不会阻塞
        TASK_SCHED.set(sched.clone()).ok();
        // ③ 异步启动加载和 worker loop
        let sched_clone = sched.clone();
        tokio::spawn(async move {
            sched_clone.start(rx).await;
        });
        Ok(sched)
    }

    /// 在任何业务里都可以拿到已初始化的调度器
    pub fn get() -> Result<Arc<Self>> {
        TASK_SCHED
            .get()
            .map(|c| c.clone())
            .ok_or_else(|| anyhow!("Task scheduler has not been init"))
    }
}

static JOB_SCHED: LazyLock<OnceCell<Arc<Scheduler<Job>>>> = LazyLock::new(|| OnceCell::new());
impl Scheduler<Job> {
    pub async fn init(app: AppHandle) -> anyhow::Result<Arc<Self>> {
        // ① 构造 Scheduler，得到 rx
        let (sched, rx) = Scheduler::<Job>::new(app.clone());
        // ② 立刻存到全局，不会阻塞
        JOB_SCHED.set(sched.clone()).ok();
        // ③ 异步启动加载和 worker loop
        let sched_clone = sched.clone();
        tokio::spawn(async move {
            sched_clone.start(rx).await;
        });
        Ok(sched.clone())
    }

    pub fn get() -> Result<Arc<Self>> {
        JOB_SCHED
            .get()
            .map(|c| c.clone())
            .ok_or_else(|| anyhow!("Job scheduler has not been init"))
    }
}
