use anyhow::{anyhow, Result};
use chrono::Utc;
use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::{Arc, LazyLock};
use surrealdb::RecordId;
use tauri::AppHandle;
use tokio::sync::{mpsc, Semaphore};

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
    /// 唯一标识
    fn id(&self) -> RecordId;
    /// 当前状态
    fn status(&self) -> Status;
    /// 重试计数
    fn retry_count(&self) -> u32;
    /// 将状态写回 DB
    async fn update_status(&self, status: Status, extra: Option<Value>) -> Result<()>;
    /// 真正执行业务的入口
    async fn handle(self) -> Result<()>;
    async fn load_pending() -> Result<Vec<Self>>;
    async fn delete(self) -> Result<()>;
    async fn on_success(self) -> Result<()>;
}

/// 2. 泛型调度器
pub struct Scheduler<T: Schedulable> {
    tx: mpsc::Sender<T>,
    pub app: AppHandle,
}

impl<T: Schedulable> Scheduler<T> {
    pub fn new(app: AppHandle) -> (Arc<Self>, mpsc::Receiver<T>) {
        let (tx, rx) = mpsc::channel(128);
        let sched = Arc::new(Self { tx, app });
        (sched, rx)
    }
    pub async fn start(self: Arc<Self>, mut rx: mpsc::Receiver<T>) {
        // let (tx, mut rx) = mpsc::channel(128);
        // let sched = Arc::new(Self { tx });
        // let sched = Arc::new(Self { tx, app });

        // 1) 首次加载
        let pending = T::load_pending().await.expect("加载 Pending 失败");
        dbg!(pending.len());
        for item in pending {
            self.tx.send(item).await.ok();
        }

        // 2) worker loop
        let worker = Arc::clone(&self);
        tokio::spawn(async move {
            while let Some(item) = rx.recv().await {
                // 写 Running
                item.update_status(Status::Running, None).await.ok();

                // 执行业务
                let res = item.clone().handle().await;

                match res {
                    Ok(()) => {
                        item.on_success().await.ok();
                    }
                    Err(err) => {
                        dbg!(&err);
                        let rc = item.retry_count() + 1;
                        item.update_status(
                            Status::Failed,
                            Some(json!({
                                "error": err.to_string(),
                                "retry_count": rc,
                            })),
                        )
                        .await
                        .ok();

                        // 如果还在重试阈值内，继续排队
                        if rc < 5 {
                            worker.tx.send(item).await.ok();
                        }
                    }
                }
            }
        });
    }

    /// 在运行时推新任务
    pub fn enqueue(&self, item: T) {
        let _ = self.tx.try_send(item);
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
