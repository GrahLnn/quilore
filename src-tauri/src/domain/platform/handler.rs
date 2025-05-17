use std::path::PathBuf;
use std::sync::LazyLock;
use std::time::Duration;

use crate::database::Crud;
use crate::domain::models::meta::GlobalVal;
use crate::domain::models::twitter::entities::DbEntitie;
use crate::domain::models::twitter::{
    asset::DbAsset, like::DbLikedPost, media::DbMedia, post::DbPost, post::DbReply, users::DbUser,
};
use crate::domain::platform::task::Task;
use anyhow::anyhow;
use anyhow::Context;
use anyhow::Result;
use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri_specta::Event;
use tokio::fs;
use tokio::{fs::File, io::AsyncWriteExt, time::timeout};

use super::emitter::Emitter;
use super::Schedulable;
use super::Status;

#[derive(Serialize, Deserialize, Debug, Clone, Type, Event)]
pub struct AssetDownloadEvent {
    pub aid: String,
    pub available: bool,
}
static HTTP_CLIENT: LazyLock<Client> = LazyLock::new(|| {
    Client::builder()
        .connect_timeout(Duration::from_secs(5))
        .timeout(Duration::from_secs(30))
        .build()
        .expect("构造 HTTP Client 失败")
});
pub async fn download_asset(task: Task) -> Result<Option<super::HandleSignal>> {
    task.update_status(Status::Running, None).await.ok();

    let mut asset = DbAsset::select_record(task.tar.clone())
        .await
        .context("查询 DbAsset 失败")?;

    let save_path = PathBuf::from(&asset.path);
    if save_path.exists() {
        if !asset.downloaded || !asset.available {
            asset.downloaded = true;
            asset.available = true;
            finish_asset_download(&asset).await?;
        }
        // 否则什么都不做
        return Ok(None);
    }

    // tmp 文件做原子替换
    let tmp_path = save_path.with_extension("tmp");
    if let Some(parent) = save_path.parent() {
        fs::create_dir_all(parent).await.ok();
    }

    let resp = HTTP_CLIENT
        .get(&asset.url)
        .send()
        .await
        .context("HTTP 请求 send() 失败")?;

    let status = resp.status().as_u16();
    if matches!(status, 404 | 403 | 307 | 401) {
        asset.downloaded = true;
        asset.available = false;
        finish_asset_download(&asset).await.context(format!(
            "download failed, resource unavailable, code {}",
            status
        ))?;
        return Ok(None);
    }
    if !resp.status().is_success() {
        return Err(anyhow!("下载失败，状态码: {}", status));
    }

    let mut file = File::create(&tmp_path).await.context("打开 tmp 文件失败")?;
    let mut stream = resp.bytes_stream();

    let mut chunk_count = 0;
    let task_result: anyhow::Result<()> = async {
        while let Some(chunk) = timeout(Duration::from_secs(10), stream.next())
            .await
            .context("分块下载整体超时")?
        {
            let data = chunk.context("读取 chunk 失败")?;
            chunk_count += 1;
            file.write_all(&data).await.context("写入 chunk 失败")?;
        }
        file.flush().await.context("文件 flush 失败")?;
        Ok(())
    }
    .await;

    match task_result {
        Ok(()) => {
            tokio::fs::rename(&tmp_path, &save_path)
                .await
                .context("重命名 tmp 文件失败")?;
            asset.downloaded = true;
            asset.available = true;
        }
        Err(_err) => {
            // 不标 downloaded, 让调度器自动重试
            asset.available = false;
            // 延迟几秒再重试，免得瞬时打爆 CDN
            tokio::time::sleep(Duration::from_secs(5)).await;
        }
    }

    finish_asset_download(&asset).await?;
    println!(
        "下载完成: {:?}, chunk_count: {}",
        asset.id.key().to_owned(),
        chunk_count
    );
    Ok(None)
}

async fn finish_asset_download(asset: &DbAsset) -> Result<()> {
    DbAsset::update(asset.id.clone(), asset.clone()).await?;
    AssetDownloadEvent {
        aid: asset.name.clone(),
        available: asset.available,
    }
    .schedule_emit()
    .await;
    Ok(())
}

pub async fn transport_asset(task: Task) -> Result<Option<super::HandleSignal>> {
    task.update_status(Status::Running, None).await.ok();
    let mut asset = DbAsset::select_record(task.tar.clone())
        .await
        .context("查询 DbAsset 失败")?;

    let file_path = PathBuf::from(&asset.path);
    let base_path =
        GlobalVal::get_save_dir().ok_or_else(|| anyhow!("Failed to get save directory"))?;
    let target_path = base_path.join(&asset.ty.as_str()).join(&asset.name);

    if let Some(parent) = target_path.parent() {
        // 目标目录不存在才创建
        if !tokio::fs::try_exists(parent).await.unwrap_or(false) {
            tokio::fs::create_dir_all(parent)
                .await
                .context("创建目标目录失败")?;
        }
    }

    // 若目标已经存在则跳过，直接更新 asset.path 字段
    let need_copy = if asset.path.contains("media unavailable") {
        // 只要 asset.path 包含 "media unavailable"，直接不复制
        false
    } else if tokio::fs::try_exists(&target_path).await.unwrap_or(false) {
        asset.path = target_path.to_string_lossy().to_string();
        false
    } else if file_path == target_path {
        false
    } else {
        true
    };

    if need_copy {
        tokio::fs::copy(&file_path, &target_path)
            .await
            .with_context(|| format!("复制文件失败: {:?} -> {:?}", file_path, target_path))?;

        asset.path = target_path.to_string_lossy().to_string();
    }

    DbAsset::update(asset.id.clone(), asset.clone()).await?;
    Ok(None)
}

// pub async fn handle_translate(task: &mut Task) -> anyhow::Result<Value> {
//     let to = task.payload.get("to_lang").and_then(Value::as_str).unwrap();
//     let translated = translate_api(&task.resource_id, to).await?;
//     Ok(json!({ "translated_text": translated }))
// }

pub async fn handle_entities(data: DbEntitie) -> Result<Vec<Task>> {
    let DbEntitie {
        like,
        posts,
        medias,
        users,
        assets,
        replies,
        tasks,
    } = data;

    let f_like = DbLikedPost::insert_jump(like);
    let f_posts = DbPost::insert_jump(posts);
    let f_media = DbMedia::insert_jump(medias);
    let f_users = DbUser::insert_jump(users);
    let f_assets = DbAsset::insert_jump(assets);
    let f_repls = DbReply::insert_jump(replies);
    let f_tasks = Task::insert_jump(tasks);

    let (_r_like, _r_posts, _r_media, _r_users, _r_assets, _r_repls, _r_tasks) =
        tokio::join!(f_like, f_posts, f_media, f_users, f_assets, f_repls, f_tasks,);
    _r_tasks
}
