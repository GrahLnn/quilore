use crate::database::enums::table::Table;
use crate::database::{Crud, HasId, Order, QueryKind};
use crate::domain::platform::TaskKind;
use crate::utils::serialize::into_u32_from_string_or_number;

use super::entities::DbEntitie;
use super::post::{DbPost, Post};

use crate::impl_crud;
use anyhow::Result;
use futures::future;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use specta::Type;
use surrealdb::RecordId;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct LikedPost {
    #[serde(deserialize_with = "into_u32_from_string_or_number")]
    pub sortidx: u32,
    pub post: Post,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbLikedPost {
    pub id: RecordId,
    pub post: RecordId,
}

impl HasId for DbLikedPost {
    fn id(&self) -> RecordId {
        self.id.clone()
    }
}

impl LikedPost {
    pub async fn take(num: i64, end: i64) -> Result<Vec<Self>> {
        let start = (end - num).max(0);
        let dbresult = DbLikedPost::range_select(start, end).await?;
        let futures = dbresult.into_iter().map(|record| async move {
            match record.clone().into_domain().await {
                Ok(domain) => Some(domain),
                Err(e) => {
                    dbg!("Error converting record to domain:", e, record.post);
                    None
                }
            }
        });
        let results = future::join_all(futures).await;
        let result: Vec<Self> = results.into_iter().filter_map(|x| x).collect();

        Ok(result)
    }

    pub async fn select_all() -> Result<Vec<Self>> {
        let dbresult = DbLikedPost::select_all().await?;
        let futures = dbresult.into_iter().map(|record| async move {
            match record.clone().into_domain().await {
                Ok(domain) => Some(domain),
                Err(e) => {
                    dbg!("Error converting record to domain:", e, record.post);
                    None
                }
            }
        });
        let results = future::join_all(futures).await;
        let result: Vec<Self> = results.into_iter().filter_map(|x| x).collect();

        Ok(result)
    }

    pub async fn select_pagin(count: i64, cursor: Option<u32>) -> Result<Vec<Self>> {
        let cursor = cursor.map(|c| DbLikedPost::record_id(c as i64));
        let dbresult = DbLikedPost::select_pagin(count, cursor).await?;
        let futures = dbresult.into_iter().map(|record| async move {
            match record.clone().into_domain().await {
                Ok(domain) => Some(domain),
                Err(e) => {
                    dbg!("Error converting record to domain:", e, record.post);
                    None
                }
            }
        });
        let results = future::join_all(futures).await;
        let result: Vec<Self> = results.into_iter().filter_map(|x| x).collect();

        Ok(result)
    }

    pub async fn select_single(sortidx: u32) -> Result<Self> {
        let id = DbLikedPost::record_id(sortidx as i64);
        let dbresult = DbLikedPost::select_record(id).await?;
        dbresult.into_domain().await
    }

    pub fn from_api(json: &Value) -> Option<Self> {
        let post = json
            .pointer("/content/itemContent/tweet_results/result")
            .and_then(Post::from_api)?;
        // let sortidx = json.pointer("/sortIndex")?.as_str()?.parse::<i64>().ok()?;
        Some(Self { sortidx: 0, post })
    }

    pub fn into_db(self) -> DbLikedPost {
        DbLikedPost::from_domain(self)
    }

    pub fn into_entities(self, task_kind: TaskKind) -> DbEntitie {
        let like = self.clone().into_db();

        let mut posts = Vec::new();
        posts.push(self.clone().post.into_db());
        if let Some(quote) = self.post.quote.clone() {
            posts.push(quote.into_db());
        }

        let mut medias = self
            .post
            .media
            .clone()
            .map(|list| list.into_iter().map(|m| m.into_db()).collect::<Vec<_>>())
            .unwrap_or_default();

        let replies = self
            .post
            .replies
            .clone()
            .map(|list| {
                list.into_iter()
                    .flat_map(|c| {
                        c.conversation
                            .iter()
                            .map(|p| p.clone().into_db())
                            .collect::<Vec<_>>()
                    })
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        let mut users = Vec::new();
        let mut assets = Vec::new();

        users.push(self.post.author.clone().into_db());
        assets.push(self.post.author.avatar.clone().into_db());

        if let Some(ref list) = self.post.media {
            for m in list {
                medias.push(m.clone().into_db());
                assets.push(m.clone().get_asset().into_db());
                if let Some(thumb) = m.clone().get_thumb() {
                    assets.push(thumb.into_db());
                }
            }
        }

        if let Some(quote) = self.post.quote.clone() {
            users.push(quote.author.clone().into_db());
            assets.push(quote.author.avatar.clone().into_db());

            if let Some(ref list) = quote.media {
                for m in list {
                    medias.push(m.clone().into_db());
                    assets.push(m.clone().get_asset().into_db());
                    if let Some(thumb) = m.clone().get_thumb() {
                        assets.push(m.clone().get_asset().into_db());
                        assets.push(thumb.into_db());
                    }
                }
            }
        }

        // 回复里所有作者和他们的头像、以及回复中的 media
        if let Some(ref list) = self.post.replies {
            for c in list {
                // 用户和头像
                for p in &c.conversation {
                    users.push(p.0.author.clone().into_db());
                    assets.push(p.0.author.avatar.clone().into_db());
                }
                // 回复里的媒体
                for p in &c.conversation {
                    if let Some(ref mlist) = p.0.media {
                        for m in mlist {
                            assets.push(m.clone().get_asset().into_db());
                            if let Some(thumb) = m.clone().get_thumb() {
                                assets.push(thumb.into_db());
                            }
                        }
                    }
                }
            }
        }

        let mut tasks = Vec::new();

        tasks.extend(assets.iter().map(|a| a.clone().into_task(task_kind.clone())));

        DbEntitie {
            like: vec![like],
            posts,
            medias,
            users,
            assets,
            replies,
            tasks,
        }
    }
}

impl_crud!(DbLikedPost, Table::LikedPost);

impl DbLikedPost {
    pub async fn into_domain(self) -> Result<LikedPost> {
        Ok(LikedPost {
            sortidx: self
                .id
                .key()
                .to_string()
                .parse::<u32>()
                .map_err(|e| anyhow::anyhow!("failed to parse rest_id: {}", e))?,
            post: DbPost::get(self.post).await?,
        })
    }

    pub fn from_domain(domain: LikedPost) -> Self {
        let sortidx_parsed = domain.sortidx;
        let post_id = domain.post.rest_id;
        Self {
            id: DbLikedPost::record_id(sortidx_parsed as i64),
            post: DbPost::record_id(post_id),
        }
    }

    pub async fn get(id: RecordId) -> Result<LikedPost> {
        let data: DbLikedPost = DbLikedPost::select_record(id).await?;
        data.into_domain().await
    }

    pub async fn select_pagin(count: i64, cursor: Option<RecordId>) -> Result<Vec<Self>> {
        DbLikedPost::query_take(
            &QueryKind::pagin(Table::LikedPost, count, cursor, Order::Desc),
            None,
        )
        .await
        .map_err(|e| e.into())
    }
}

#[tauri::command]
#[specta::specta]
pub async fn take_single_like(sortidx: u32) -> Result<LikedPost, String> {
    LikedPost::select_single(sortidx)
        .await
        .map_err(|e| e.to_string())
}
