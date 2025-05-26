use std::str::FromStr;

use super::interface::Chunk;
use super::twitter::post::{DbPost, Post};
use crate::database::enums::table::Rel;
use crate::database::{query_raw, query_take, Crud, HasId, Order, QueryKind};
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RelEdge {
    id: RecordId,
    #[serde(rename = "in")]
    in_id: RecordId,
    #[serde(rename = "out")]
    out_id: RecordId,
    created_at: Datetime,
}

impl Collection {
    pub async fn select_all(name: String) -> Result<Self> {
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

    pub async fn select_pagin(
        name: String,
        count: i64,
        cursor: Option<String>,
    ) -> Result<Chunk<Post>> {
        // let cursor = cursor.map(|c| RecordId::from_str(&c).unwrap());
        let posts_ids = DbCollection::select_pagin(name, count, cursor).await?;
        let sql = format!(
            "SELECT * FROM [{}];",
            posts_ids
                .data
                .iter()
                .map(|id| id.to_string())
                .collect::<Vec<String>>()
                .join(",")
        );
        let db_posts = DbPost::query_take(sql.as_str(), None).await?;
        let mut items = Vec::with_capacity(db_posts.len());
        for p in db_posts {
            items.push(p.into_domain().await.unwrap());
        }
        let cursor = posts_ids.cursor;

        Ok(Chunk {
            cursor,
            data: items,
        })
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
        let id = Self::select_record_id("name", &name).await?;
        Self::delete_record(id).await
    }

    pub async fn relate(a: RecordId, b: RecordId) -> Result<()> {
        Self::relate_by_id(a, b, Rel::Collect).await
    }

    pub async fn collect<T>(name: String, target: T) -> Result<()>
    where
        T: HasId + Send + Sync,
    {
        let self_id: RecordId = Self::select_record_id("name", &name).await?;
        Self::relate(self_id, target.id()).await
    }

    pub async fn uncollect<T>(name: String, target: T) -> Result<()>
    where
        T: HasId + Send + Sync,
    {
        let self_id: RecordId = Self::select_record_id("name", &name).await?;
        Self::unrelate_by_id(self_id, target.id(), Rel::Collect).await
    }

    pub async fn outs_records(id: RecordId) -> Result<Vec<RecordId>> {
        Self::outs(id, Rel::Collect, Table::Post).await
    }

    pub async fn all_related(name: &str) -> Result<Vec<RecordId>> {
        let self_id: RecordId = Self::select_record_id("name", name).await?;
        Self::outs_records(self_id).await
    }

    pub async fn records() -> Result<Vec<RecordId>> {
        Self::all_record().await
    }

    pub async fn select_pagin(
        name: String,
        count: i64,
        cursor: Option<String>,
    ) -> Result<Chunk<RecordId>> {
        let self_id: RecordId = Self::select_record_id("name", &name).await?;
        let rel_response: Vec<RelEdge> = query_take(
            &QueryKind::rel_pagin(
                self_id,
                Rel::Collect,
                count,
                cursor,
                Order::Desc,
                "created_at",
            ),
            None,
        )
        .await?;
        if rel_response.is_empty() {
            return Err(anyhow::anyhow!("No data found"));
        }
        let ids: Vec<RecordId> = rel_response.iter().map(|r| r.out_id.clone()).collect();
        let cursor = rel_response
            .last()
            .map(|r| r.created_at.to_string())
            .unwrap();
        Ok(Chunk { cursor, data: ids })
    }

    pub async fn which_collect(id: RecordId) -> Result<Vec<String>> {
        let ids: Vec<RecordId> = Self::ins(id, Rel::Collect, Table::Collection).await?;
        if ids.is_empty() {
            return Ok(vec![]);
        }
        let sql = QueryKind::single_field_by_ids(ids, "name");
        let names: Vec<String> = query_take(sql.as_str(), None).await?;
        Ok(names)
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
    let _ = DbCollection::collect(collection.clone(), post.clone().into_db())
        .await
        .map_err(|e| e.to_string());
    println!("collect post {} to {collection} ", post.rest_id);
    Ok(())
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
    Collection::select_all(name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn select_collection_pagin(
    name: String,
    cursor: Option<String>,
) -> Result<Chunk<Post>, String> {
    Collection::select_pagin(name, 200, cursor)
        .await
        .map_err(|e| e.to_string())
}
