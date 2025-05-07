mod database;
mod domain;
mod enums;
mod utils;

use std::path::PathBuf;
use std::str::FromStr;

use anyhow::Result;
use database::init_db;
use domain::models::meta;
use domain::models::meta::GlobalVal;
use domain::models::twitter::entities::DbEntitie;
use domain::models::twitter::{
    content_to_copy::ContentToCopy,
    interface,
    like::{take_single_like, LikedPost},
};
use domain::models::userkv::{get_userkv_value, upsert_userkv};
use domain::platform::api::user::ScanLikesEvent;
use domain::platform::emitter::AssetDownloadBatchEvent;
use domain::platform::job::Job;
use domain::platform::scheduler::Scheduler;
use domain::platform::twitter::api::user;
use domain::platform::{handle_entities, Task, TaskKind};
use utils::event::ImportEvent;
use utils::file;
use utils::load::{read_tweets_from_json, TweetData, TweetMetaData};

use specta_typescript::{formatter::prettier, Typescript};
use tauri::async_runtime::{self, block_on};
use tauri::Manager;
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_specta::Event;
use tauri_specta::{collect_commands, collect_events, Builder};
use tokio::task::block_in_place;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder: Builder = Builder::new()
        .commands(collect_commands![
            interface::take_post_chunk,
            copy_to_clipboard,
            meta::upsert_metakv,
            meta::get_meta_value,
            upsert_userkv,
            get_userkv_value,
            take_single_like,
            save_all,
            import_data,
            user::scan_likes_timeline,
            meta::get_save_dir,
            file::exists,
        ])
        .events(collect_events![
            ScanLikesEvent,
            AssetDownloadBatchEvent,
            ImportEvent
        ]);

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
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            let handle = app.handle().clone();
            builder.mount_events(app);
            block_in_place(|| {
                block_on(async move {
                    let local_data_dir = handle.path().app_local_data_dir()?;
                    let db_path = local_data_dir.join("quilore.db");
                    init_db(db_path).await?;
                    GlobalVal::init().await?;
                    async_runtime::spawn(async move {
                        Scheduler::<Task>::init(handle.clone()).await?;
                        Scheduler::<Job>::init(handle.clone()).await?;
                        Ok::<(), anyhow::Error>(())
                    });
                    Ok(())
                })
            })
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
#[specta::specta]
async fn save_all(app: tauri::AppHandle) -> Result<(), String> {
    dbg!("save_all");
    let datas = LikedPost::select_all().await.map_err(|e| e.to_string())?;
    let res = TweetData {
        metadata: TweetMetaData {
            item: "liked".to_string(),
            created_at: "2023-05-10T08:00:00Z".to_string(),
            proj_path: "".to_string(),
        },
        results: datas,
    };
    let json = serde_json::to_string(&res).map_err(|e| e.to_string())?;
    let download_dir = app
        .path()
        .resolve("", tauri::path::BaseDirectory::Download)
        .map_err(|e| e.to_string())?;
    let output_path = download_dir.join("output.json");
    dbg!(&output_path);
    std::fs::write(output_path, json).map_err(|e| e.to_string())?;
    dbg!("save_all done");
    Ok(())
}

#[tauri::command]
#[specta::specta]
async fn copy_to_clipboard(
    app_handle: tauri::AppHandle,
    content: ContentToCopy,
) -> Result<(), String> {
    let toml_str = toml::to_string(&content).map_err(|e| e.to_string())?;
    app_handle.clipboard().write_text(toml_str).unwrap();
    Ok(())
}

#[tauri::command]
#[specta::specta]
async fn import_data(path: &str) -> Result<(), String> {
    let path_buf = PathBuf::from_str(path).map_err(|e| e.to_string())?;
    let data = read_tweets_from_json(path_buf).map_err(|e| e.to_string())?;
    dbg!("read");
    let list = data.results;
    let entities = list
        .iter()
        .map(|post| post.clone().into_entities(TaskKind::AssetTransport))
        .collect::<Vec<_>>();
    dbg!("make entities");
    let merged = DbEntitie::merge_all(entities);
    dbg!("merge entities");
    let tasks = handle_entities(merged).await.map_err(|e| e.to_string())?;
    dbg!("handle entities");
    for task in tasks {
        let _ = Scheduler::<Task>::get()
            .map_err(|e| e.to_string())?
            .enqueue(task);
    }
    let app = Scheduler::<Task>::get()
        .map_err(|e| e.to_string())?
        .app
        .clone();
    ImportEvent { done: true }
        .emit(&app)
        .map_err(|e| e.to_string())?;
    dbg!("done");
    Ok(())
}
