use crate::database::Crud;
use crate::impl_schema;
use crate::{database::enums::table::Table, impl_crud};

use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct ScrollCursor {
    pub name: String,
    pub cursor: String,
}

impl_crud!(ScrollCursor, Table::ScrollCursor);
impl_schema!(
    ScrollCursor,
    r#"DEFINE INDEX unique_name ON TABLE scroll_cursor FIELDS name UNIQUE;"#
);

impl ScrollCursor {
    pub async fn create_scroll_cursor(name: String, cursor: String) -> Result<()> {
        // Self { name, cursor }.create().await.map(|_| ())
        Self::upsert_by_id(Self::record_id(name.clone()), Self { name, cursor })
            .await
            .map(|_| ())
    }

    pub async fn delete_scroll_cursor(name: String) -> Result<()> {
        let id = Self::select_record_id("name", &name).await?;
        Self::delete_record(id).await
    }

    pub async fn select_all_scroll_cursors() -> Result<Vec<ScrollCursor>> {
        let records = Self::select_all().await?;
        Ok(records)
    }

    // pub async fn update_scroll_cursor(name: String, cursor: u32) -> Result<()> {
    //     let id = Self::select_record_id("name", &name).await?;
    //     let data = Self { name, cursor };
    //     Self::update(id, data).await.map(|_| ())
    // }
}

#[tauri::command]
#[specta::specta]
pub async fn create_scroll_cursor(name: String, cursor: String) -> Result<(), String> {
    println!("create_scroll_cursor: {:?}:{:?}", name, cursor);
    ScrollCursor::create_scroll_cursor(name, cursor)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn delete_scroll_cursor(name: String) -> Result<(), String> {
    ScrollCursor::delete_scroll_cursor(name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn select_all_scroll_cursors() -> Result<Vec<ScrollCursor>, String> {
    ScrollCursor::select_all_scroll_cursors()
        .await
        .map_err(|e| e.to_string())
}

// #[tauri::command]
// #[specta::specta]
// pub async fn update_scroll_cursor(name: String, cursor: u32) -> Result<(), String> {
//     ScrollCursor::update_scroll_cursor(name, cursor)
//         .await
//         .map_err(|e| e.to_string())
// }
