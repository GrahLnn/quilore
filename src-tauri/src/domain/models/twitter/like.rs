use crate::database::enums::table::Table;
use crate::database::{Crud, HasId};
use crate::utils::json_path;
use crate::utils::serialize::{i64_from_string_or_number, i64_to_string};

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

    pub fn from_json(json: &Value) -> Option<Self> {
        let post = Post::from_json(&json_path::get_path(
            json,
            "content.itemContent.tweet_results.result",
        ))?;
        let sortidx = json_path::get_string(json, "sortIndex")?
            .parse::<i64>()
            .ok()?;
        Some(Self { sortidx, post })
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_from_json() {
        let json = json!({
            "sortIndex": "1914753776963561233",
            "content": {
                "itemContent": {
                    "tweet_results": {
                        "result": {
                            "rest_id": "1914869413079036055",
                            "core": {
                                "user_results": {
                                    "result": {
                                        "legacy": {
                                            "name": "𝚐𝑪𝗾𝚡𝚡𝗾",
                                            "screen_name": "gm8xx8",
                                            "profile_image_url_https": "https://pbs.twimg.com/profile_images/1723513473294835712/pvPLgqp3_normal.jpg"
                                        }
                                    }
                                }
                            },
                            "note_tweet": {
                                "note_tweet_results": {
                                    "result": {
                                        "text": "Muon Optimizer Accelerates Grokking\n\nMuon optimizer accelerates grokking in Transformers (mean epoch: 102.89 vs 153.09, p < 1e‑7) across 7 modular arithmetic tasks. Combines spectral norm constraints + second-order info. Also evaluates interactions with softmax variants (standard, stablemax, sparsemax)."
                                    }
                                }
                            },
                            "legacy": {
                                "created_at": "Wed Apr 23 02:30:19 +0000 2025",
                                "lang": "en"
                            },
                            
                        }
                    }
                }
            }
        });

        let liked_post = LikedPost::from_json(&json);
        assert!(liked_post.is_some());

        let liked_post = liked_post.unwrap();
        // assert_eq!(liked_post.sortidx, 1914753776963561233);
        // assert_eq!(liked_post.post.rest_id.to_string(), "1914869413079036055");
        // assert_eq!(liked_post.post.author.id, "gm8xx8");
        // assert_eq!(liked_post.post.author.name, "𝚐𝑪𝗾𝚡𝚡𝗾");
        // assert_eq!(liked_post.post.content.text, "Muon Optimizer Accelerates Grokking\n\nMuon optimizer accelerates grokking in Transformers (mean epoch: 102.89 vs 153.09, p < 1e‑7) across 7 modular arithmetic tasks. Combines spectral norm constraints + second-order info. Also evaluates interactions with softmax variants (standard, stablemax, sparsemax).");
        // assert_eq!(liked_post.post.content.lang, "en");
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
