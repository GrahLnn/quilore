use super::twitter::post::{DbPost, Post};
use crate::database::{query_take, Crud, HasId, Order, QueryKind};
use crate::impl_schema;
use crate::{database::enums::table::Table, impl_crud};

use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;
use surrealdb::sql::Datetime;
use surrealdb::RecordId;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct Collection {
    pub name: String,
    pub items: Vec<Post>,
}

impl Collection {
    pub async fn select(name: String) -> Result<Self> {
        let ids: Vec<String> = DbCollection::all_related(&name)
            .await?
            .iter()
            .map(|id| id.to_string())
            .collect();
        let sql = format!("SELECT * FROM [{}];", ids.join(","));
        let db_posts = DbPost::query_take(sql.as_str(), None).await?;
        let mut items = Vec::with_capacity(db_posts.len());
        for p in db_posts {
            items.push(p.into_domain().await.unwrap());
        }
        Ok(Self { name, items })
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbCollection {
    pub name: String,
    pub created_at: Datetime,
}

impl_crud!(DbCollection, Table::Collection);
impl_schema!(
    DbCollection,
    r#"
    DEFINE FIELD name ON TABLE collection TYPE string;
    DEFINE INDEX unique_name ON TABLE collection FIELDS name UNIQUE;
    DEFINE FIELD created_at ON TABLE collection TYPE datetime;
    DEFINE FIELD in ON TABLE collect TYPE record;
    DEFINE FIELD out ON TABLE collect TYPE record;
    DEFINE INDEX unique_collect ON TABLE collect FIELDS in, out UNIQUE;
"#
);

impl DbCollection {
    pub async fn create_collection(name: String) -> Result<()> {
        Self {
            name,
            created_at: chrono::Utc::now().into(),
        }
        .create()
        .await
        .map(|_| ())
    }

    pub async fn delete_collection(name: String) -> Result<()> {
        Self::delete(&name).await
    }

    pub async fn collect<T>(name: String, target: T) -> Result<()>
    where
        T: HasId + Send + Sync,
    {
        // self.relate(target, "collect").await
        let self_id: RecordId = Self::select_record_id("name", &name).await?;
        Self::relate_by_id(self_id, target.id(), "collect").await
    }

    pub async fn uncollect<T>(name: String, target: T) -> Result<()>
    where
        T: HasId + Send + Sync,
    {
        // self.unrelate(target, "collect").await
        let self_id: RecordId = Self::select_record_id("name", &name).await?;
        Self::unrelate_by_id(self_id, target.id(), "collect").await
    }

    pub async fn all_related(name: &str) -> Result<Vec<RecordId>> {
        let self_id: RecordId = Self::select_record_id("name", name).await?;
        let sql = format!("RETURN {self_id}->collect->post;");
        let records: Vec<RecordId> = query_take(sql.as_str(), None).await?;
        Ok(records)
    }
}

#[tauri::command]
#[specta::specta]
pub async fn create_collection(name: String) -> Result<(), String> {
    DbCollection::create_collection(name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn delete_collection(name: String) -> Result<(), String> {
    DbCollection::delete_collection(name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn all_collection() -> Result<Vec<String>, String> {
    let data = DbCollection::query_take(
        &QueryKind::all_by_order(Table::Collection, Order::Desc, "created_at"),
        None,
    )
    .await
    .map_err(|e| e.to_string())?;
    let names = data.into_iter().map(|record| record.name).collect();
    Ok(names)
}

#[tauri::command]
#[specta::specta]
pub async fn collect_post(collection: String, post: Post) -> Result<(), String> {
    DbCollection::collect(collection, post.into_db())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn uncollect_post(collection: String, post: Post) -> Result<(), String> {
    DbCollection::uncollect(collection, post.into_db())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn select_collection(name: String) -> Result<Collection, String> {
    Collection::select(name).await.map_err(|e| e.to_string())
}
