use crate::utils::event::WINDOW_READY;
use anyhow::{anyhow, Result};
use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::atomic::{AtomicBool, Ordering};
use std::{
    sync::{Arc, LazyLock, Mutex},
    time::Duration,
};

use super::{
    job::{Job, Mission},
    Task,
};
use specta::Type;
use surrealdb::RecordId;
use tauri::AppHandle;
use tauri_specta::Event;
use tokio::sync::{
    mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender},
    Semaphore,
};

pub static SCHEDULER_PAUSED: AtomicBool = AtomicBool::new(false);

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

    pub async fn start(self: Arc<Self>, mut rx: UnboundedReceiver<T>, pending: Option<Vec<T>>) {
        let tx = self.tx.clone();
        let pending = pending.unwrap_or(T::load_pending().await.expect("加载 Pending 失败"));
        for item in pending {
            if let Err(e) = tx.send(item) {
                tracing::error!("无法发送初始化任务: {}", e);
            }
        }

        // Worker loop
        tokio::spawn(async move {
            while let Some(item) = rx.recv().await {
                while SCHEDULER_PAUSED.load(Ordering::SeqCst) {
                    tokio::time::sleep(Duration::from_millis(200)).await;
                }
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
                            println!("任务失败: {:?}, 重试次数: {}", item.id(), rc);
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
            sched_clone.start(rx, None).await;
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

#[derive(Serialize, Deserialize, Debug, Copy, Clone, Type)]
pub struct JobCheckEvent {
    pub mission: Mission,
    pub user_say: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Type, Event)]
pub struct JobChecksEvent {
    pub jobs: Vec<JobCheckEvent>,
}
static JOB_CHECK_REPLY: LazyLock<Mutex<Option<tokio::sync::oneshot::Sender<Vec<JobCheckEvent>>>>> =
    LazyLock::new(|| Mutex::new(None));
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
            let pending_jobs = Job::load_pending().await.expect("加载 Pending 失败");
            if !pending_jobs.is_empty() {
                // 1. emit 事件，告知前端有待确认的 pending
                let jobs_for_event: Vec<JobCheckEvent> = pending_jobs
                    .iter()
                    .map(|j| JobCheckEvent {
                        mission: j.mission.clone(),
                        user_say: None,
                    })
                    .collect();

                while !WINDOW_READY.load(Ordering::SeqCst) {
                    tokio::time::sleep(Duration::from_secs(1)).await;
                }

                JobChecksEvent {
                    jobs: jobs_for_event,
                }
                .emit(&app)
                .map_err(|e| anyhow!("emit JobChecksEvent 失败: {}", e))
                .ok();

                // 2. 创建 oneshot channel
                let (sender, receiver) = tokio::sync::oneshot::channel();
                // 3. 存到全局静态变量，供 command 用
                *JOB_CHECK_REPLY.lock().unwrap() = Some(sender);

                // 4. 等待前端 command 调用
                let user_reply = receiver.await.expect("等待前端选择失败");
                *JOB_CHECK_REPLY.lock().unwrap() = None;

                let jobs_to_resume: Vec<_> = pending_jobs
                    .into_iter()
                    .filter(|job| {
                        user_reply
                            .iter()
                            .find(|r| r.mission == job.mission)
                            .and_then(|r| r.user_say)
                            .unwrap_or(false)
                    })
                    .collect();

                sched_clone.start(rx, Some(jobs_to_resume)).await;
            } else {
                sched_clone.start(rx, None).await;
            }
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

#[tauri::command]
#[specta::specta]
pub async fn reply_pending_jobs(jobs: Vec<JobCheckEvent>) -> Result<(), String> {
    let mut guard = JOB_CHECK_REPLY.lock().unwrap();
    if let Some(sender) = guard.take() {
        sender
            .send(jobs)
            .map_err(|_| "Rust端等待已结束或已消费".to_string())
    } else {
        Err("oneshot sender 已被消费或未初始化".to_string())
    }
}

#[derive(Serialize, Deserialize, Debug, Copy, Clone, Type, Event)]
pub struct SchedulerPauseEvent {
    pub paused: bool,
}

#[tauri::command]
#[specta::specta]
pub async fn pause_scheduler(app: tauri::AppHandle) -> Result<(), String> {
    SCHEDULER_PAUSED.store(true, Ordering::SeqCst);
    SchedulerPauseEvent { paused: true }
        .emit(&app)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn resume_scheduler(app: tauri::AppHandle) -> Result<(), String> {
    SCHEDULER_PAUSED.store(false, Ordering::SeqCst);
    SchedulerPauseEvent { paused: false }
        .emit(&app)
        .map_err(|e| e.to_string())?;
    Ok(())
}
