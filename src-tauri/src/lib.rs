mod database;
mod domain;
mod enums;
mod utils;

use anyhow::Result;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::atomic::Ordering;
use std::time::Duration;

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
use domain::platform::scheduler::{self, Scheduler};
use domain::platform::twitter::api::user;
use domain::platform::{handle_entities, Task, TaskKind};

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
use utils::macos_titlebar;

#[cfg(target_os = "macos")]
thread_local! {
    static MAIN_WINDOW_OBSERVER: RefCell<Option<macos_titlebar::FullscreenStateManager>> = RefCell::new(None);
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
    ];

    let commands = collect_commands![
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
        app_ready,
        scheduler::reply_pending_jobs,
        scheduler::pause_scheduler,
        scheduler::resume_scheduler,
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
                    println!("db_path: {:?}", db_path);
                    init_db(db_path).await?;
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
                            // Call the setup function from your new module
                            macos_titlebar::setup_custom_macos_titlebar(&window);
                            use objc2::MainThreadMarker;

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
    event::ImportEvent { done: true }
        .emit(&app)
        .map_err(|e| e.to_string())?;
    dbg!("done");
    Ok(())
}

#[tauri::command]
#[specta::specta]
async fn app_ready(app_handle: AppHandle) {
    let window = app_handle.get_webview_window("main").unwrap();
    window.show().unwrap();
    WINDOW_READY.store(true, Ordering::SeqCst);
}
