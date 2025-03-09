mod database;
mod domain;
mod utils;

use crate::domain::models::meta::DbMeta;
use anyhow::Result;
use database::core::{init_db, Curd};
use domain::{
    enums::meta::MetaKey,
    models::twitter::{
        interface::LikedChunk,
        like::{DbLikedPost, LikedPost},
        media::DbMedia,
        post::{DbPost, DbReply, Post, PostType},
        users::DbUser,
    },
};
use futures::future;
use specta_typescript::{formatter::prettier, Typescript};
use tauri::async_runtime::block_on;
use tauri::Manager;
use tauri_specta::{collect_commands, Builder};
use tokio::task::block_in_place;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder: Builder = Builder::new().commands(collect_commands![take_post_chunk]);

    #[cfg(debug_assertions)]
    builder
        .export(
            Typescript::default()
                .formatter(prettier)
                .header("/* eslint-disable */"),
            "../src/cmd/commands.ts",
        )
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();

            block_in_place(|| {
                block_on(async move {
                    let local_data_dir = handle.path().app_local_data_dir()?;
                    let db_path = local_data_dir.join("quilore.db");
                    init_db(db_path).await?;
                    // load_scraper_data().await?;
                    Ok(())
                })
            })
        })
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(builder.invoke_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn load_scraper_data() -> Result<()> {
    let path = r#"C:\Users\grahl\quill\output\x.com.GrahLnn.likes\scraped_data.json"#;
    let (dbposts, dbreplies, dbmedias, dbusers, dbfavs, db_metadatas) =
        utils::load::load_data(path).await?;
    let _ = DbPost::insert_with_id(dbposts).await?;

    let _ = DbUser::insert_with_id(dbusers).await?;
    let _ = DbLikedPost::insert_with_id(dbfavs).await?;
    let _ = DbMedia::insert_with_id(dbmedias).await?;
    let _ = DbReply::insert_with_id(dbreplies).await?;
    let _ = DbMeta::insert_with_id(db_metadatas).await?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
async fn take_post_chunk(cursor: Option<i32>) -> Result<LikedChunk, String> {
    let cursor_i64 = match cursor {
        Some(cursor) => cursor as i64,
        None => DbMeta::get(MetaKey::FirstCursor.as_str().to_string())
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| anyhow::anyhow!("FirstCursor not found"))
            .map_err(|e| e.to_string())?
            .into_number(),
    };
    let interval = 200;
    let data = LikedPost::take(interval, cursor_i64)
        .await
        .map_err(|e| e.to_string())?;
    let cursor = (cursor_i64 - interval as i64).max(0);
    Ok(LikedChunk { cursor, data })
}
