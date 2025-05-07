use async_trait::async_trait;
use once_cell::sync::Lazy;
use serde::Serialize;
use specta::Type;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use tauri_specta::Event;
use tokio::sync::Mutex;

use crate::domain::platform::handler::AssetDownloadEvent;
use crate::domain::platform::{Scheduler, Task};

/// 批量 AssetDownload 事件，用于一次性通知前端
#[derive(Serialize, Clone, Debug, Type, Event)]
pub struct AssetDownloadBatchEvent {
    pub items: Vec<AssetDownloadEvent>,
}

/// 通用事件发射器接口，将事件推入去抖动缓冲并定时批量发射
#[async_trait]
pub trait Emitter {
    /// 将单个事件加入缓冲，延迟后批量 emit
    async fn schedule_emit(self);
}

/// 去抖动缓冲器，实现对任意 T 的批量缓冲与延迟触发
pub struct DebounceEmitter<T, F>
where
    T: Clone + Send + Sync + 'static,
    F: Fn(Vec<T>) + Send + Sync + 'static,
{
    buffer: Arc<Mutex<Vec<T>>>,
    last_push: Arc<Mutex<Instant>>,
    delay: Duration,
    on_emit: Arc<F>,
    spawning: Arc<AtomicBool>,
}

impl<T, F> DebounceEmitter<T, F>
where
    T: Clone + Send + Sync + Serialize + 'static,
    F: Fn(Vec<T>) + Send + Sync + 'static,
{
    /// 新建一个延迟 delay_ms(ms) 的去抖动缓冲器
    pub fn new(delay_ms: u64, on_emit: F) -> Self {
        DebounceEmitter {
            buffer: Arc::new(Mutex::new(Vec::new())),
            last_push: Arc::new(Mutex::new(Instant::now())),
            delay: Duration::from_millis(delay_ms),
            on_emit: Arc::new(on_emit),
            spawning: Arc::new(AtomicBool::new(false)),
        }
    }

    /// 将事件推入缓冲，并在无新事件 delay 时间后执行 `on_emit`
    pub async fn push(&self, item: T) {
        // 收集事件
        {
            let mut buf = self.buffer.lock().await;
            buf.push(item);
        }
        // 更新时间戳
        {
            let mut ts = self.last_push.lock().await;
            *ts = Instant::now();
        }
        // spawn guard
        if self.spawning.swap(true, Ordering::SeqCst) {
            return;
        }
        let buffer = Arc::clone(&self.buffer);
        let last_push = Arc::clone(&self.last_push);
        let delay = self.delay;
        let on_emit = Arc::clone(&self.on_emit);
        let spawning = Arc::clone(&self.spawning);

        tokio::spawn(async move {
            loop {
                tokio::time::sleep(delay).await;
                let is_idle = {
                    let ts = last_push.lock().await;
                    ts.elapsed() >= delay
                };
                if is_idle {
                    let items = {
                        let mut buf = buffer.lock().await;
                        std::mem::take(&mut *buf)
                    };
                    if !items.is_empty() {
                        (on_emit)(items);
                    }
                    spawning.store(false, Ordering::SeqCst);
                    break;
                }
            }
        });
    }
}

/// 后端批量发射函数，将多个 AssetDownloadEvent 打包并 emit
fn emit_asset_batch(items: Vec<AssetDownloadEvent>) {
    let app = Scheduler::<Task>::get().unwrap().app.clone();
    let batch = AssetDownloadBatchEvent { items };
    let _ = batch.emit(&app);
}

/// 单例去抖动缓冲器，用于 AssetDownloadEvent
static ASSET_DOWNLOAD_EMITTER: Lazy<
    DebounceEmitter<AssetDownloadEvent, fn(Vec<AssetDownloadEvent>)>,
> = Lazy::new(|| DebounceEmitter::new(100, emit_asset_batch));

#[async_trait]
impl Emitter for AssetDownloadEvent {
    async fn schedule_emit(self) {
        ASSET_DOWNLOAD_EMITTER.push(self).await;
    }
}
