use super::{
    media::{DbMedia, Media},
    users::{DbUser, User},
};
use crate::database::core::{Curd, HasId};
use crate::domain::enums::table::Table;
use crate::utils::serialize::{ i64_from_string_or_number , i64_to_string};
use anyhow::{Error, Result};
use futures::future::join_all;
use serde::{Deserialize, Serialize};
use specta::Type;
use surrealdb::RecordId;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct QuotePost {
    #[serde(serialize_with = "i64_to_string")]
    #[serde(deserialize_with = "i64_from_string_or_number")]
    #[specta(type = String)]
    pub rest_id: i64,
    pub created_at: String,
    pub author: User,
    pub content: Content,
    pub media: Option<Vec<Media>>,
    pub key_words: Option<Vec<String>>,
    pub card: Option<Card>,
    pub article: Option<Article>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct Post {
    #[serde(serialize_with = "i64_to_string")]
    #[serde(deserialize_with = "i64_from_string_or_number")]
    #[specta(type = String)]
    pub rest_id: i64,
    pub created_at: String,
    pub author: User,
    pub content: Content,
    pub media: Option<Vec<Media>>,
    pub quote: Option<QuotePost>,
    pub key_words: Option<Vec<String>>,
    pub replies: Option<Vec<Conversation>>,
    pub card: Option<Card>,
    pub article: Option<Article>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbPost {
    pub id: RecordId,
    pub created_at: String,
    pub author: RecordId,
    pub content: Content,
    pub media: Option<Vec<RecordId>>,
    pub quote: Option<RecordId>,
    pub key_words: Option<Vec<String>>,
    pub replies: Option<Vec<DbConversation>>,
    pub card: Option<Card>,
    pub article: Option<Article>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbReply(pub DbPost);

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct Content {
    pub lang: String,
    pub text: String,
    pub translation: Option<String>,
    pub expanded_urls: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct Card {
    pub title: Option<String>,
    pub description: Option<String>,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct Article {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct Conversation {
    pub conversation: Vec<Post>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbConversation {
    pub conversation: Vec<RecordId>,
}

pub enum PostType {
    Post,
    Reply,
}

impl Post {
    pub async fn save(&self) -> Result<DbPost> {
        let data = DbPost::from_domain(self.clone(), PostType::Post)?;
        DbPost::create_by_id(self.rest_id, data)
            .await
            .map_err(Error::from)
    }

    pub fn to_quote(&self) -> QuotePost {
        QuotePost {
            rest_id: self.rest_id.clone(),
            created_at: self.created_at.clone(),
            author: self.author.clone(),
            content: self.content.clone(),
            media: self.media.clone(),
            key_words: self.key_words.clone(),
            card: self.card.clone(),
            article: self.article.clone(),
        }
    }

    pub fn from_quote(quote: QuotePost) -> Post {
        Post {
            rest_id: quote.rest_id.clone(),
            created_at: quote.created_at.clone(),
            author: quote.author.clone(),
            content: quote.content.clone(),
            media: quote.media.clone(),
            quote: None,
            key_words: quote.key_words.clone(),
            replies: None,
            card: quote.card.clone(),
            article: quote.article.clone(),
        }
    }
}

impl Curd for DbPost {
    const TABLE: &'static str = Table::Post.as_str();
}

impl Curd for DbReply {
    const TABLE: &'static str = Table::Reply.as_str();
}

impl HasId for DbPost {
    fn id(&self) -> RecordId {
        self.id.clone()
    }
}

impl HasId for DbReply {
    fn id(&self) -> RecordId {
        self.0.id.clone()
    }
}

impl DbPost {
    async fn convert_media(media_ids: Vec<RecordId>) -> Result<Vec<Media>> {
        let media_results = join_all(
            media_ids
                .into_iter()
                .map(|id| async { DbMedia::get(id).await }),
        )
        .await;
        media_results.into_iter().collect()
    }

    async fn convert_quote(quote_id: RecordId) -> Result<QuotePost> {
        let db_post: DbPost = DbPost::select_record(quote_id).await?;

        // 处理media字段
        let media = match db_post.clone().media {
            Some(media_ids) => Some(Self::convert_media(media_ids).await?),
            None => None,
        };

        Ok(QuotePost {
            rest_id: db_post
                .id
                .key()
                .to_string()
                .parse::<i64>()
                .map_err(|e| anyhow::anyhow!("failed to parse rest_id: {}", e))?,
            created_at: db_post.created_at,
            author: DbUser::get(db_post.author).await?,
            content: db_post.content,
            media,
            key_words: db_post.key_words,
            card: db_post.card,
            article: db_post.article,
        })
    }

    async fn convert_replies(replies: Vec<DbConversation>) -> Result<Vec<Conversation>> {
        let conv_results: Vec<Result<Conversation>> =
            join_all(replies.into_iter().map(|conv| async {
                // 并发获取对话中所有帖子的内容
                let posts: Vec<Post> =
                    join_all(conv.conversation.into_iter().map(|post_id| async {
                        let mut post = DbPost::get(post_id).await?;
                        post.replies = None;
                        Ok(post)
                    }))
                    .await
                    .into_iter()
                    .collect::<Result<Vec<Post>>>()?;
                Ok(Conversation {
                    conversation: posts,
                })
            }))
            .await;

        conv_results.into_iter().collect()
    }

    pub async fn into_domain(self) -> Result<Post> {
        // 分离各部分的转换逻辑
        let media = match self.media {
            Some(media_ids) => Some(Self::convert_media(media_ids).await?),
            None => None,
        };

        let quote = match self.quote {
            Some(quote_id) => Some(Self::convert_quote(quote_id).await?),
            None => None,
        };

        // 需要显示引用的时候再查
        // let replies = match self.replies {
        //     Some(replies) => Some(Self::convert_replies(replies).await?),
        //     None => None,
        // };

        Ok(Post {
            rest_id: self
                .id
                .key()
                .to_string()
                .parse::<i64>()
                .map_err(|e| anyhow::anyhow!("failed to parse rest_id: {}", e))?,
            created_at: self.created_at,
            author: DbUser::get(self.author).await?,
            content: self.content,
            media,
            quote,
            key_words: self.key_words,
            replies: None,
            card: self.card,
            article: self.article,
        })
    }

    pub fn from_domain(post: Post, which: PostType) -> Result<Self> {
        Ok(Self {
            id: match which {
                PostType::Reply => DbReply::record_id(post.rest_id),
                PostType::Post => DbPost::record_id(post.rest_id),
            },
            created_at: post.created_at.clone(),
            author: DbUser::record_id(post.author.id.as_str()),
            content: post.content.clone(),
            media: post.media.as_ref().map(|media_vec| {
                media_vec
                    .iter()
                    .map(|media| match media {
                        Media::Photo(photo) => DbMedia::record_id(photo.base.id.as_str()),
                        Media::Video(video) => DbMedia::record_id(video.base.id.as_str()),
                        Media::AnimatedGif(gif) => DbMedia::record_id(gif.base.id.as_str()),
                    })
                    .collect()
            }),
            quote: post
                .quote
                .as_ref()
                .map(|quote| DbPost::record_id(quote.rest_id)),
            key_words: post.key_words.clone(),
            replies: post.replies.as_ref().map(|conv_vec| {
                conv_vec
                    .iter()
                    .map(|conv| DbConversation {
                        conversation: conv
                            .conversation
                            .iter()
                            .map(|post| DbReply::record_id(post.rest_id))
                            .collect(),
                    })
                    .collect()
            }),
            card: post.card.clone(),
            article: post.article.clone(),
        })
    }

    pub async fn get(id: RecordId) -> Result<Post> {
        let data: DbPost = DbPost::select_record(id).await?;
        data.into_domain().await
    }
}
