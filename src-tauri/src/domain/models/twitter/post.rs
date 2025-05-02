use super::{
    media::{DbMedia, Media},
    users::{DbUser, User},
};
use crate::database::enums::table::Table;
use crate::database::{Crud, HasId};
use crate::utils::serialize::{i64_from_string_or_number, i64_to_string};
use crate::{impl_crud, impl_id};
use anyhow::{Error, Result};
use futures::future::join_all;
use serde::{Deserialize, Serialize};
use serde_json::Value;
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

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct Reply(pub QuotePost);

impl Reply {
    pub fn into_db(self) -> DbReply {
        DbReply(DbPost::from_domain(self.0.into_post(), PostType::Reply))
    }
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
    pub is_root: bool,
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
    pub conversation: Vec<Reply>,
}

impl Conversation {
    pub fn into_db(self) -> DbConversation {
        DbConversation::from_domain(self)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbConversation {
    pub conversation: Vec<RecordId>,
}

impl DbConversation {
    pub fn from_domain(conv: Conversation) -> Self {
        Self {
            conversation: conv
                .conversation
                .into_iter()
                .map(|post| DbPost::record_id(post.0.rest_id))
                .collect(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub enum PostType {
    Root,
    Quote,
    Reply,
}

impl Card {
    pub fn from_api(data: &Value) -> Option<Self> {
        match data {
            Value::Null => None,
            _ => {
                // 1. 先拿到 card 对象并过滤 rest_id
                let card = data.get("card")?;
                let rest_id = card.get("rest_id")?.as_str()?;
                if rest_id.contains("card://") {
                    return None;
                }

                // 2. 从 binding_values 里查字符串
                let binding_vals = card.pointer("/legacy/binding_values")?.as_array()?;
                let get_binding = |key: &str| -> Option<String> {
                    binding_vals
                        .iter()
                        .find(|b| {
                            // 先拿出 key，再和期待的 key 做比较，返回 bool
                            b.get("key")
                                .and_then(|v| v.as_str())
                                .map_or(false, |s| s == key)
                        })
                        .and_then(|b| b.pointer("/value/string_value").and_then(Value::as_str))
                        .map(|s| s.to_string())
                };

                // 3. 基础字段：title, description, card_url
                let mut title = get_binding("title");
                let mut description = get_binding("description");
                let card_url = get_binding("card_url")?;

                // 4. 找到 expanded_url
                let url = data
                    .pointer("/legacy/entities/urls")?
                    .as_array()?
                    .iter()
                    .find(|u| {
                        u.get("url")
                            .and_then(|v| v.as_str())
                            .map_or(false, |s| s == &card_url)
                    })
                    .and_then(|u| u.get("expanded_url")?.as_str())
                    .map(str::to_string)?;

                // 过滤掉“compose?recipient”场景
                if url.contains("compose?recipient") {
                    return None;
                }

                // 5. 如果 title 和 description 都空，则进入 unified_card / 空间 等分支
                if title.is_none() && description.is_none() {
                    // 5a. unified_card
                    if let Some(unified) = get_binding("unified_card") {
                        let value: Value = serde_json::from_str(&unified).ok()?;
                        let prefix = "/component_objects/details_1";
                        let ty = value.pointer(&format!("{}/type", prefix))?.as_str()?;
                        match ty {
                            "grok_share" => {
                                let conv = value
                                    .pointer(&format!("{}/data/conversation_preview", prefix))?;
                                title = conv
                                    .get("0")
                                    .and_then(|v| v.get("message"))
                                    .and_then(Value::as_str)
                                    .map(str::to_string);
                                description = conv
                                    .get("1")
                                    .and_then(|v| v.get("message"))
                                    .and_then(Value::as_str)
                                    .map(str::to_string);
                            }
                            "twitter_list_details" => {
                                title = value
                                    .pointer(&format!("{}/data/name/content", prefix))
                                    .and_then(Value::as_str)
                                    .map(str::to_string);
                                if let Some(count) = value
                                    .pointer(&format!("{}/data/member_count", prefix))
                                    .and_then(Value::as_u64)
                                {
                                    description = Some(format!("list · {} members", count));
                                }
                            }
                            "community_details" => {
                                title = value
                                    .pointer(&format!("{}/data/name/content", prefix))
                                    .and_then(Value::as_str)
                                    .map(str::to_string);
                                if let Some(count) = value
                                    .pointer(&format!("{}/data/member_count", prefix))
                                    .and_then(Value::as_u64)
                                {
                                    description = Some(format!("community · {} members", count));
                                }
                            }
                            other => {
                                eprintln!(
                                    "无法匹配 unified_card 类型 `{}`，来源 URL: {}",
                                    other, url
                                );
                            }
                        }
                    }
                    // 5b. narrow_cast_space_type → AudioSpace
                    else if get_binding("narrow_cast_space_type").is_some() {
                        let cast_id = get_binding("id")?;
                        // 假设你有一个方法可以拿到空间信息
                        let space_info = Self::fetch_space_info(&cast_id)?;
                        if let Some(meta) = space_info.pointer("/data/audioSpace/metadata") {
                            title = meta
                                .get("title")
                                .and_then(Value::as_str)
                                .map(str::to_string);
                            if let Some(started) = meta.get("started_at").and_then(Value::as_str) {
                                description = Some(format!("AudioSpace · started at {}", started));
                            }
                        } else {
                            title = Some("unavailable AudioSpace".to_string());
                            // 这里你可以选择把 url 置空或直接返回 None
                        }
                    }
                    // 5c. URL 含 “spaces” 直接跳过
                    else if url.contains("spaces") {
                        return None;
                    }
                    // 5d. 其他情况
                    else {
                        eprintln!(
                            "unified_card 和 narrow_cast_space_type 均未匹配，来源 URL: {}",
                            url
                        );
                    }
                }

                // 6. 构造并返回
                Some(Card {
                    title,
                    description,
                    url,
                })
            }
        }
    }

    /// 这个方法只是示例，你需要自己实现实际调用逻辑
    fn fetch_space_info(_cast_id: &str) -> Option<Value> {
        // TODO: 调用 API 或查询缓存，返回 serde_json::Value
        None
    }
}

impl Content {
    pub fn from_api(json: &Value) -> Option<Self> {
        // 1. 获取主体文本
        let mut text = json
            .pointer("/note_tweet/note_tweet_results/result/text")
            .or_else(|| json.pointer("/legacy/full_text"))
            .and_then(Value::as_str)
            .map(str::to_string)?;

        // 2. 收集所有需移除的短链和展开 URL
        let mut urls_for_removal = Vec::new();
        let mut expanded_urls = Vec::new();

        // 2a. 简单路径：card.url 和 quoted_status_permalink.url
        if let Some(url) = json.pointer("/card/url").and_then(Value::as_str) {
            urls_for_removal.push(url.to_string());
        }
        if let Some(url) = json
            .pointer("/legacy/quoted_status_permalink/url")
            .and_then(Value::as_str)
        {
            urls_for_removal.push(url.to_string());
        }

        // 2b. 媒体 URL
        if let Some(media_array) = json
            .pointer("/legacy/entities/media")
            .and_then(Value::as_array)
        {
            media_array
                .iter()
                .filter_map(|m| m.pointer("/url").and_then(Value::as_str))
                .for_each(|url| urls_for_removal.push(url.to_string()));
        }

        // 2c. 实体 URLs（包括 legacy.entities.urls 和 note_tweet.entity_set.urls）
        for path in &[
            "/legacy/entities/urls",
            "/note_tweet/note_tweet_results/result/entity_set/urls",
        ] {
            if let Some(url_objs) = json.pointer(path).and_then(Value::as_array) {
                url_objs.iter().for_each(|obj| {
                    if let (Some(short), Some(expanded)) = (
                        obj.pointer("/url").and_then(Value::as_str),
                        obj.pointer("/expanded_url").and_then(Value::as_str),
                    ) {
                        urls_for_removal.push(short.to_string());
                        expanded_urls.push(expanded.to_string());
                    }
                });
            }
        }

        // 3. 按短链长度降序排序，反复移除尾部完全匹配的短链
        urls_for_removal.sort_unstable_by_key(|u| std::cmp::Reverse(u.len()));
        for short in &urls_for_removal {
            while text.ends_with(short) {
                text.truncate(text.len() - short.len());
                text = text.trim_end().to_string();
            }
        }

        // 4. 拼装最终结构
        let text = html_escape::decode_html_entities(&text).trim().to_string();
        let lang = json
            .pointer("/legacy/lang")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();
        let expanded_urls = (!expanded_urls.is_empty()).then_some(expanded_urls);

        Some(Self {
            text,
            lang,
            translation: None,
            expanded_urls,
        })
    }
}

impl Article {
    pub fn from_api(json: &Value) -> Option<Self> {
        match json {
            Value::Null => None,
            _ => Some(Self {
                id: json.get("id").and_then(|v| v.as_str())?.to_string(),
                title: json.get("title").and_then(|v| v.as_str())?.to_string(),
                description: json
                    .get("preview_text")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string() + "..."),
                url: json
                    .get("rest_id")
                    .and_then(|v| v.as_str())
                    .map(|s| "https://x.com/i/status/".to_owned() + s)?,
            }),
        }
    }
}

impl Post {
    pub fn into_db(self) -> DbPost {
        DbPost::from_domain(self, PostType::Root)
    }

    pub async fn save(&self) -> Result<DbPost> {
        let data = DbPost::from_domain(self.clone(), PostType::Root);
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
    pub fn from_api(json: &Value) -> Option<Self> {
        if json.get("__typename").and_then(|v| v.as_str()) == Some("TweetTombstone") {
            return None;
        } else {
            let json = json.get("tweet").map_or(json, |v| v);
            let rest_id = json
                .get("rest_id")
                .and_then(|v| v.as_str())?
                .parse::<i64>()
                .ok()?;
            let author = json
                .pointer("/core/user_results/result/legacy")
                .and_then(User::from_api)?;
            let created_at = json
                .pointer("/legacy/created_at")
                .and_then(|v| v.as_str())?
                .to_string();
            let content = Content::from_api(json)?;
            let media = json
                .pointer("/legacy/extended_entities/media")
                .and_then(Value::as_array)
                .map(|media_array| {
                    media_array
                        .iter()
                        .filter_map(|media_item| Media::from_api(media_item))
                        .collect()
                });
            let card = Card::from_api(json);
            let article = json
                .pointer("/article/article_results/result")
                .and_then(Article::from_api);
            let quote = json
                .pointer("/quoted_status_result/result")
                .and_then(QuotePost::from_api);

            Some(Self {
                rest_id,
                author,
                content,
                media,
                created_at,
                card,
                article,
                quote,
                key_words: None,
                replies: None,
            })
        }
    }
}

impl QuotePost {
    pub fn from_api(json: &Value) -> Option<Self> {
        if json.get("__typename").and_then(|v| v.as_str()) == Some("TweetTombstone") {
            return None;
        } else {
            let json = json.get("tweet").map_or(json, |v| v);
            let rest_id = json
                .get("rest_id")
                .and_then(|v| v.as_str())?
                .parse::<i64>()
                .ok()?;
            let author = json
                .pointer("/core/user_results/result/legacy")
                .and_then(User::from_api)?;
            let created_at = json
                .pointer("/legacy/created_at")
                .and_then(|v| v.as_str())?
                .to_string();
            let content = Content::from_api(json)?;
            let media = json
                .pointer("/legacy/extended_entities/media")
                .and_then(Value::as_array)
                .map(|media_array| {
                    media_array
                        .iter()
                        .filter_map(|media_item| Media::from_api(media_item))
                        .collect()
                });
            let card = Card::from_api(json);
            let article = json
                .pointer("/article/article_results/result")
                .and_then(Article::from_api);

            Some(Self {
                rest_id,
                author,
                content,
                media,
                created_at,
                card,
                article,
                key_words: None,
            })
        }
    }
    pub fn into_post(self) -> Post {
        Post::from_quote(self)
    }
    pub fn into_db(self) -> DbPost {
        DbPost::from_domain(self.into_post(), PostType::Quote)
    }
}

impl_crud!(DbPost, Table::Post);
impl_crud!(DbReply, Table::Reply);
impl_id!(DbPost, id);
impl_id!(DbReply, 0.id);

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
                    conversation: posts.into_iter().map(|p| Reply(p.to_quote())).collect(),
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
        let replies = None;

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
            replies,
            card: self.card,
            article: self.article,
        })
    }

    pub fn from_domain(post: Post, which: PostType) -> Self {
        Self {
            id: match which {
                PostType::Reply => DbReply::record_id(post.rest_id),
                PostType::Root | PostType::Quote => DbPost::record_id(post.rest_id),
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
            replies: post
                .replies
                .as_ref()
                .map(|conv_vec| conv_vec.iter().map(|conv| conv.clone().into_db()).collect()),
            card: post.card.clone(),
            article: post.article.clone(),
            is_root: match which {
                PostType::Root => true,
                PostType::Quote | PostType::Reply => false,
            },
        }
    }

    pub async fn get(id: RecordId) -> Result<Post> {
        let data: DbPost = DbPost::select_record(id).await?;
        data.into_domain().await
    }
}
