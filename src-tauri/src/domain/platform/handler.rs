use std::path::PathBuf;

use crate::database::enums::meta::MetaKey;
use crate::database::Crud;
use crate::database::DBError;
use crate::database::Result;
use crate::domain::models::meta::DbMeta;
use crate::domain::models::meta::GlobalVal;
use crate::domain::models::twitter::asset::AssetType;
use crate::domain::models::twitter::entities::DbEntitie;
use crate::domain::models::twitter::{
    asset::DbAsset, like::DbLikedPost, media::DbMedia, post::DbPost, post::DbReply, users::DbUser,
};
use crate::domain::platform::task::Task;
use anyhow::anyhow;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri_specta::Event;

use tokio::fs;

use super::emitter::Emitter;
use super::Schedulable;
use super::Scheduler;
use super::Status;

#[derive(Serialize, Deserialize, Debug, Clone, Type, Event)]
pub struct AssetDownloadEvent {
    pub aid: String,
    pub available: bool,
}

pub async fn download_asset(task: Task) -> Result<()> {
    if task.status == Status::Succeeded {
        return Ok(());
    }
    task.update_status(Status::Running, None).await.ok();
    let mut asset = DbAsset::select_record(task.tar.clone()).await?;
    // let base_path = GlobalVal::get_save_dir().ok_or_else(|| anyhow!("保存目录未设置"))?;

    // let clean_url = asset.url.split('?').next().unwrap_or(&asset.url);
    // 确定子目录
    // let subfolder = match asset.ty {
    //     AssetType::Avatar => "avatar",
    //     AssetType::Media => "media",
    //     AssetType::Thumb => "thumb",
    // };

    // 目标文件路径
    // let filename = clean_url.split('/').last().unwrap_or("unknown.bin");
    // let save_path = base_path.join(subfolder).join(asset.name.clone());
    let save_path = PathBuf::from(asset.path.clone());

    if save_path.exists() {
        asset.downloaded = true;
        asset.available = true;
        return finish_asset_download(&asset).await;
    }

    // 确保文件夹存在
    if let Some(parent) = save_path.parent() {
        fs::create_dir_all(parent).await.ok();
    }

    let client = Client::new();

    let resp = client
        .get(&asset.url)
        .send()
        .await
        .map_err(|e| anyhow!("下载失败: {}", e))?;
    if resp.status().as_u16() == 404 || resp.status().as_u16() == 403 {
        // 标记为下载失败，但不重试
        asset.downloaded = true;
        asset.available = false;
        return finish_asset_download(&asset).await;
    }
    if !resp.status().is_success() {
        return Err(anyhow!("下载失败，状态码: {}", resp.status()).into());
    }

    let bytes = resp.bytes().await.map_err(|e| anyhow!(e))?;

    let write_res = fs::write(&save_path, &bytes).await;
    if let Err(e) = write_res {
        return Err(anyhow!("保存文件失败: {}", e).into());
    }

    // 更新 Asset
    asset.available = true;
    asset.downloaded = true;

    finish_asset_download(&asset).await
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
