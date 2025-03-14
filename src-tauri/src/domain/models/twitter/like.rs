use super::post::{DbPost, Post};
use crate::database::core::{Curd, HasId};
use crate::domain::enums::sql::Queries;
use crate::domain::enums::table::Table;
use crate::utils::serialize::{i64_from_string_or_number, i64_to_string};
use anyhow::Result;
use futures::future;
use serde::{Deserialize, Serialize};
use specta::Type;
use surrealdb::RecordId;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct LikedPost {
    #[serde(deserialize_with = "i64_from_string_or_number")]
    #[serde(serialize_with = "i64_to_string")]
    #[specta(type = String)]
    pub sortidx: i64,
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
    pub async fn take(num: usize, end: i64) -> Result<Vec<Self>> {
        let start = (end - (num as i64)).max(0);
        let dbresult = DbLikedPost::query_take(
            Queries::range_query(Table::LikedPost, start, end).as_str(),
            None,
        )
        .await?;
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
}

impl Curd for DbLikedPost {
    const TABLE: &'static str = Table::LikedPost.as_str();
}

impl DbLikedPost {
    pub async fn into_domain(self) -> Result<LikedPost> {
        Ok(LikedPost {
            sortidx: self
                .id
                .key()
                .to_string()
                .parse::<i64>()
                .map_err(|e| anyhow::anyhow!("failed to parse rest_id: {}", e))?,
            post: DbPost::get(self.post).await?,
        })
    }

    pub fn from_domain(domain: LikedPost) -> Result<Self> {
        let sortidx_parsed = domain.sortidx;
        let post_id = domain.post.rest_id;
        Ok(Self {
            id: DbLikedPost::record_id(sortidx_parsed),
            post: DbPost::record_id(post_id),
        })
    }

    pub async fn get(id: RecordId) -> Result<LikedPost> {
        let data: DbLikedPost = DbLikedPost::select_record(id).await?;
        data.into_domain().await
    }
}
