mod database;
mod domain;
mod enums;
mod utils;

use anyhow::Result;
use database::init_db;
use domain::models::collect::DbCollection;
use domain::models::{interface, scroll_position};
use domain::models::meta::GlobalVal;
use domain::models::twitter::entities::DbEntitie;
use domain::models::twitter::utils::clean_database;
use domain::models::twitter::{
    content_to_copy::ContentToCopy,
    like::{take_single_like, LikedPost},
};
use domain::models::userkv::{get_userkv_value, upsert_userkv};
use domain::models::{collect, meta};
use domain::platform::api::user::ScanLikesEvent;
use domain::platform::emitter::AssetDownloadBatchEvent;
use domain::platform::job::{self, Job};
use domain::platform::scheduler::{self, Scheduler};
use domain::platform::twitter::api::user;
use domain::platform::{handle_entities_replace, Task, TaskKind};
use serde::Serialize;
use std::collections::HashMap;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::atomic::Ordering;
use std::time::Duration;
use surrealdb::RecordId;

use tokio::time::sleep;
use utils::event::{self, WINDOW_READY};
use utils::file;
use utils::load::{read_tweets_from_json, TweetData, TweetMetaData};

use specta_typescript::{formatter::prettier, Typescript};
use tauri::async_runtime::{self, block_on};
use tauri::{AppHandle, Manager};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_specta::Event;
use tauri_specta::{collect_commands, collect_events, Builder};
use tokio::task::block_in_place;

#[cfg(target_os = "macos")]
use std::cell::RefCell;
#[cfg(target_os = "macos")]
thread_local! {
    static MAIN_WINDOW_OBSERVER: RefCell<Option<utils::macos_titlebar::FullscreenStateManager>> = RefCell::new(None);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let events = collect_events![
        ScanLikesEvent,
        AssetDownloadBatchEvent,
        event::ImportEvent,
        event::FullScreenEvent,
        scheduler::JobChecksEvent,
        scheduler::SchedulerPauseEvent,
        job::ScanLikesIncEvent,
    ];

    let commands = collect_commands![
        interface::take_post_chunk,
        interface::check_has_data,
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
        app_ready,
        scheduler::reply_pending_jobs,
        scheduler::pause_scheduler,
        scheduler::resume_scheduler,
        get_mouse_and_window_position,
        collect::create_collection,
        collect::collect_post,
        collect::uncollect_post,
        collect::all_collection,
        collect::delete_collection,
        collect::select_collection,
        collect::select_collection_pagin,
        scroll_position::create_scroll_cursor,
        scroll_position::delete_scroll_cursor,
        scroll_position::select_all_scroll_cursors,
    ];

    let builder: Builder = Builder::new().commands(commands).events(events);

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
                    let cur_time = std::time::Instant::now();
                    println!("db_path: {:?}", db_path);
                    init_db(db_path).await?;
                    println!("init_db done, cost {}s", cur_time.elapsed().as_secs_f64());
                    GlobalVal::init().await?;

                    if let Some(window) = handle.get_webview_window("main") {
                        tokio::spawn({
                            let window = window.clone();
                            async move {
                                sleep(Duration::from_secs(5)).await;
                                if !window.is_visible().unwrap_or(true) {
                                    // This happens if the JS bundle crashes and hence doesn't send ready event.
                                    println!(
										"Window did not emit `app_ready` event fast enough. Showing window..."
									);
                                    window.show().expect("Main window should show");
                                    WINDOW_READY.store(true, Ordering::SeqCst);
                                }
                            }
                        });

                        #[cfg(target_os = "windows")]
                        {
                            window.set_decorations(false).unwrap();
                        }
                        #[cfg(target_os = "macos")]
                        {
                            use objc2::MainThreadMarker;
                            use utils::macos_titlebar;
                            macos_titlebar::setup_custom_macos_titlebar(&window);

                            // Manage the FullscreenObserver's lifetime.
                            // This is a bit tricky because you need to store it somewhere
                            // so it doesn't get dropped immediately.
                            // One way is to put it in Tauri's state management if you have complex needs,
                            // or for a single main window, you might 'leak' it if it needs to live
                            // for the duration of the app and its Drop impl handles cleanup.
                            // A better way is to have a struct that holds it and is managed by Tauri's state.
                            if let Some(mtm) = MainThreadMarker::new() {
                                // Get MTM for the observer
                                if let Some(observer) =
                                    macos_titlebar::FullscreenStateManager::new(&window, mtm)
                                {
                                    // How to store `observer`?
                                    // Option 1: Put it in Tauri's managed state
                                    MAIN_WINDOW_OBSERVER.with(|cell| {
                                        let mut observer_ref = cell.borrow_mut();
                                        *observer_ref = Some(observer);
                                    });
                                // Option 2: If you absolutely must leak it (less ideal, but works for app lifetime objects)
                                // std::mem::forget(observer);
                                // println!("Fullscreen observer created and forgotten (will live for app duration).");
                                } else {
                                    eprintln!("Failed to create FullscreenObserver.");
                                }
                            } else {
                                eprintln!(
                                    "Failed to get MainThreadMarker for FullscreenObserver setup."
                                );
                            }

                            // Example: Listening for window events to re-hide traffic lights if needed (alternative to FullscreenObserver for other events)
                            let window_clone = window.clone();
                            window.on_window_event(move |event| {
                                match event {
                                    tauri::WindowEvent::Resized(_) => { // Or other relevant events
                                         // This is a more generic way, but NSWindowDidExitFullScreenNotification is more specific
                                         // For instance, if some other action makes them reappear.
                                         // #[cfg(target_os = "macos")]
                                         // {
                                         //     if let Some(mtm) = MainThreadMarker::new() {
                                         //         let ns_window_ptr = window_clone.ns_window().unwrap_or(std::ptr::null_mut()) as *mut objc2_app_kit::NSWindow;
                                         //         if !ns_window_ptr.is_null() {
                                         //             if let Some(ns_window_id) = unsafe { Id::retain(ns_window_ptr) } {
                                         //                 // unsafe { macos_titlebar::hide_native_traffic_lights(&ns_window_id, mtm); }
                                         //             }
                                         //         }
                                         //     }
                                         // }
                                    }
                                    _ => {}
                                }
                            });
                        }
                    }
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
    println!("import_data: {}", path);
    // let mut saved_collections: HashMap<RecordId, Vec<RecordId>> = HashMap::new();

    // let collections = DbCollection::records().await.map_err(|e| e.to_string())?;
    // for collection in collections {
    //     let posts = DbCollection::outs_records(collection.clone())
    //         .await
    //         .map_err(|e| e.to_string())?;
    //     saved_collections.insert(collection, posts);
    // }

    // scheduler::clean_all().await.map_err(|e| e.to_string())?;
    // clean_database().await.map_err(|e| e.to_string())?;
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
    let tasks = handle_entities_replace(merged).await.map_err(|e| e.to_string())?;
    dbg!("handle entities");
    for task in tasks {
        let _ = Scheduler::<Task>::get()
            .map_err(|e| e.to_string())?
            .enqueue(task);
    }
    // dbg!("handle collections");
    // for (collection_name, rest_ids) in saved_collections {
    //     for id in rest_ids {
    //         let _ = DbCollection::relate(collection_name.clone(), id)
    //             .await
    //             .map_err(|e| e.to_string())?;
    //     }
    // }

    let app = Scheduler::<Task>::get()
        .map_err(|e| e.to_string())?
        .app
        .clone();
    event::ImportEvent { done: true }
        .emit(&app)
        .map_err(|e| e.to_string())?;
    dbg!("done");
    // [TODO] 换一个不删库的方案
    // Err("not implemented".to_string())
    Ok(())
}

#[tauri::command]
#[specta::specta]
async fn app_ready(app_handle: AppHandle) {
    let window = app_handle.get_webview_window("main").unwrap();
    window.show().unwrap();
    WINDOW_READY.store(true, Ordering::SeqCst);
}

#[derive(Serialize, specta::Type)]
struct MouseWindowInfo {
    mouse_x: i32,
    mouse_y: i32,
    window_x: i32,
    window_y: i32,
    window_width: u32,
    window_height: u32,
    rel_x: i32,
    rel_y: i32,
    pixel_ratio: f64,
}

#[tauri::command]
#[specta::specta]
fn get_mouse_and_window_position(app: AppHandle) -> Result<MouseWindowInfo, String> {
    let window = app.get_webview_window("main").ok_or("未找到窗口 main")?;

    // ① 鼠标位置
    let cursor = window
        .cursor_position()
        .map_err(|e| format!("获取鼠标位置失败: {e:?}"))?;

    // ② 窗口左上角
    let win_pos = window
        .outer_position()
        .map_err(|e| format!("获取窗口位置失败: {e:?}"))?;

    // ③ 窗口尺寸
    let win_size = window
        .outer_size()
        .map_err(|e| format!("获取窗口尺寸失败: {e:?}"))?;

    // ④ 缩放因子
    let pixel_ratio = window
        .scale_factor()
        .map_err(|e| format!("获取缩放因子失败: {e:?}"))?;

    // ⑤ 计算相对坐标
    let rel_x = cursor.x as i32 - win_pos.x;
    let rel_y = cursor.y as i32 - win_pos.y;

    Ok(MouseWindowInfo {
        mouse_x: cursor.x as i32,
        mouse_y: cursor.y as i32,
        window_x: win_pos.x,
        window_y: win_pos.y,
        window_width: win_size.width,
        window_height: win_size.height,
        rel_x,
        rel_y,
        pixel_ratio,
    })
}
