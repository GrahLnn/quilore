use super::models::CursoredData;
use super::requests::user;
use crate::database::Crud;
use crate::domain::models::twitter::entities::DbEntitie;
use crate::domain::models::twitter::like::LikedPost;
use crate::domain::platform::job::{Job, Mission};
use crate::domain::platform::scheduler::Scheduler;
use crate::domain::platform::twitter::auth::auth::{self, AuthGenerator};
use crate::domain::platform::{handle_entities, scheduler, Schedulable, Task};
use crate::domain::platform::TaskKind;

use anyhow::anyhow;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use specta::Type;
use tauri_specta::Event;

#[tauri::command]
#[specta::specta]
pub async fn scan_likes_timeline() -> Result<(), String> {
    let id = Job::record_id(Mission::ScanLikes.as_str());

    let job = Job {
        id,
        mission: Mission::ScanLikes,
        status: scheduler::Status::Pending,
        params: serde_json::json!({ "cursor": null }),
        error: None,
        retry_count: 0,
        max_retry_count: 3,
        started_at: None,
        finished_at: None,
    };

    job.upsert().await.map_err(|e| e.to_string())?;
    Scheduler::<Job>::get()
        .map_err(|e| e.to_string())?
        .enqueue(job);

    Ok(())
}

#[derive(Serialize, Deserialize, Debug, Clone, Type, Event)]
pub struct ScanLikesEvent {
    pub count: u32,
    pub running: bool,
}

pub async fn process_likes_chunk(job: Job) -> anyhow::Result<()> {
    let job_record = Job::select_record(Job::record_id(Mission::ScanLikes.as_str())).await?;
    job.update_status(scheduler::Status::Running, None).await?;
    let cursor = job_record
        .params
        .get("cursor")
        .and_then(Value::as_str)
        .map(|s| s.to_string());
    let last_sortidx = job_record
        .params
        .get("last_sortidx")
        .and_then(Value::as_u64)
        .map(|v| v as u32);
    let count = (job_record
        .params
        .get("count")
        .and_then(|v| v.as_u64())
        .unwrap_or(0)) as u32;
    let cred = auth::UserAuth.generate().await?;
    let twid = cred
        .clone()
        .cookie
        .ok_or(anyhow!("No cookie found"))?
        .twid
        .ok_or(anyhow!("No twid found in cookie"))?
        .replace("u%3D", "");
    let req = user::likes(twid, None, cursor);
    let client = reqwest::Client::new();
    let mut url = reqwest::Url::parse(&req.url)?;
    url.set_query(Some(&req.params.to_string()));

    let resp = client
        .request(req.method, url.clone())
        .headers(cred.headers())
        .send()
        .await?;

    if !resp.status().is_success() {
        return Err(anyhow!("error code: {}, URL: {}", resp.status(), url));
    }

    let json_data = resp.json::<Value>().await?;

    let result = CursoredData::<LikedPost>::from_response(&json_data, last_sortidx).await?;
    let next = result.clone().next;
    let list = result.clone().list;
    let entities = list
        .iter()
        .map(|post| post.clone().into_entities(TaskKind::AssetDownload))
        .collect::<Vec<_>>();
    let merged = DbEntitie::merge_all(entities);
    let checked_tasks = handle_entities(merged).await?;
    let excu_tasks = checked_tasks
        .iter()
        .filter(|t| !matches!(t.status, scheduler::Status::Succeeded))
        .cloned()
        .collect::<Vec<_>>();
    dbg!(excu_tasks.len());
    for task in excu_tasks {
        let _ = Scheduler::<Task>::get()?.enqueue(task);
    }
    let count = count + list.len() as u32;
    job_record
        .update_params(serde_json::json!({
            "cursor": next,
            "count": count,
            "is_end": result.is_end,
            "last_sortidx": result.list.last().map(|p| p.sortidx)
        }))
        .await?;
    if !result.is_end {
        Scheduler::<Job>::get()?.enqueue(job);
    }

    let app = Scheduler::<Job>::get()?.app.clone();
    ScanLikesEvent {
        count,
        running: !result.is_end,
    }
    .emit(&app)
    .map_err(|e| anyhow!("emit ScanLikesProgressEvent 失败: {}", e))?;
    Ok(())
}
