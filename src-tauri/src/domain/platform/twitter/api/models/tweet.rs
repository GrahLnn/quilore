use serde::{Deserialize, Serialize};
use serde_json::Value;
use specta::Type;

use super::enums::MediaType;
use super::user::User;
use super::utils::find_by_filter;
use crate::domain::models::twitter::like::LikedPost;
use crate::domain::platform::twitter::api::models::enums::EntriesType;
use crate::utils::json_path;

/// 推文实体（链接、标签等）
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TweetEntities {
    /// 标签列表
    pub hashtags: Vec<String>,

    /// 提及的用户列表
    pub mentioned_users: Vec<String>,

    /// URL列表
    pub urls: Vec<String>,
}

impl TweetEntities {
    /// 将自身转换为JSON
    pub fn to_json(&self) -> Value {
        serde_json::to_value(self).unwrap_or(Value::Null)
    }
}

/// 推文媒体内容
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TweetMedia {
    /// 缩略图URL（视频类型时使用）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumbnail_url: Option<String>,

    /// 媒体类型
    pub r#type: MediaType,

    /// 媒体URL
    pub url: String,
}

impl TweetMedia {
    /// 将自身转换为JSON
    pub fn to_json(&self) -> Value {
        serde_json::to_value(self).unwrap_or(Value::Null)
    }
}


// #[derive(Debug, Clone, Serialize, Deserialize, Type)]
// pub struct Tweet {
//     /// 书签数量
//     pub bookmark_count: u32,

//     /// 对话ID
//     pub conversation_id: String,

//     /// 创建时间
//     pub created_at: String,

//     /// 推文实体
//     pub entities: TweetEntities,

//     /// 完整文本内容
//     pub full_text: String,

//     /// 推文ID
//     pub id: String,

//     /// 语言
//     pub lang: String,

//     /// 点赞数量
//     pub like_count: u32,

//     /// 媒体内容
//     #[serde(skip_serializing_if = "Option::is_none")]
//     pub media: Option<Vec<TweetMedia>>,

//     /// 引用数量
//     pub quote_count: u32,

//     /// 被引用的推文
//     #[serde(skip_serializing_if = "Option::is_none")]
//     pub quoted: Option<Box<Tweet>>,

//     /// 回复数量
//     pub reply_count: u32,

//     /// 回复给的推文ID
//     #[serde(skip_serializing_if = "Option::is_none")]
//     pub reply_to: Option<String>,

//     /// 转发数量
//     pub retweet_count: u32,

//     /// 转发的推文
//     #[serde(skip_serializing_if = "Option::is_none")]
//     pub retweeted_tweet: Option<Box<Tweet>>,

//     /// 推文作者
//     pub tweet_by: User,

//     /// 推文URL
//     pub url: String,

//     /// 查看数量
//     pub view_count: u32,
// }

// impl Tweet {
//     /// 从JSON数据创建Tweet实例
//     pub fn from_json(tweet_data: &Value) -> Option<Self> {
//         // 提取必要字段
//         let rest_id = json_path::get_string(tweet_data, "rest_id");
//         let created_at = json_path::get_string(tweet_data, "legacy.created_at");
//         let full_text =
//             json_path::get_string(tweet_data, "note_tweet.note_tweet_results.result.text")
//                 .or_else(|| json_path::get_string(tweet_data, "legacy.full_text"));
//         let lang = json_path::get_string(tweet_data, "legacy.lang");
//         let conversation_id = json_path::get_string(tweet_data, "legacy.conversation_id_str");

//         // 提取统计数据
//         let quote_count = json_path::get_path(tweet_data, "legacy.quote_count")
//             .and_then(|v| v.as_u64())
//             .unwrap_or(0) as u32;
//         let reply_count = json_path::get_path(tweet_data, "legacy.reply_count")
//             .and_then(|v| v.as_u64())
//             .unwrap_or(0) as u32;
//         let retweet_count = json_path::get_path(tweet_data, "legacy.retweet_count")
//             .and_then(|v| v.as_u64())
//             .unwrap_or(0) as u32;
//         let like_count = json_path::get_path(tweet_data, "legacy.favorite_count")
//             .and_then(|v| v.as_u64())
//             .unwrap_or(0) as u32;
//         let view_count = json_path::get_string(tweet_data, "views.count")
//             .and_then(|s| s.parse::<u32>().ok())
//             .unwrap_or(0);
//         let bookmark_count = json_path::get_path(tweet_data, "legacy.bookmark_count")
//             .and_then(|v| v.as_u64())
//             .unwrap_or(0) as u32;

//         // 提取作者信息
//         let author_data = json_path::get_path(tweet_data, "core.user_results.result");
//         let author = author_data.as_ref().and_then(|data| {
//             Some(User {
//                 created_at: "".to_string(), // 这个字段在响应中可能没有
//                 description: json_path::get_string(data, "legacy.description"),
//                 followers_count: json_path::get_path(data, "legacy.followers_count")
//                     .and_then(|v| v.as_u64())
//                     .unwrap_or(0) as u32,
//                 followings_count: json_path::get_path(data, "legacy.friends_count")
//                     .and_then(|v| v.as_u64())
//                     .unwrap_or(0) as u32,
//                 full_name: json_path::get_string(data, "legacy.name").unwrap_or_default(),
//                 id: json_path::get_string(data, "rest_id").unwrap_or_default(),
//                 is_verified: json_path::get_path(data, "legacy.verified")
//                     .and_then(|v| v.as_bool())
//                     .unwrap_or(false),
//                 like_count: 0, // 这个字段在响应中可能没有
//                 location: json_path::get_string(data, "legacy.location"),
//                 pinned_tweet: None, // 这个字段在响应中可能没有
//                 profile_banner: json_path::get_string(data, "legacy.profile_banner_url"),
//                 profile_image: json_path::get_string(data, "legacy.profile_image_url_https")
//                     .unwrap_or_default(),
//                 statuses_count: json_path::get_path(data, "legacy.statuses_count")
//                     .and_then(|v| v.as_u64())
//                     .unwrap_or(0) as u32,
//                 user_name: json_path::get_string(data, "legacy.screen_name").unwrap_or_default(),
//             })
//         });

//         // 提取实体信息
//         let entities_data = json_path::get_path(tweet_data, "legacy.entities");
//         let entities = entities_data
//             .as_ref()
//             .map(|data| {
//                 let hashtags = json_path::get_array(data, "hashtags")
//                     .unwrap_or_default()
//                     .iter()
//                     .filter_map(|h| json_path::get_string(h, "text"))
//                     .collect();

//                 let mentioned_users = json_path::get_array(data, "user_mentions")
//                     .unwrap_or_default()
//                     .iter()
//                     .filter_map(|u| json_path::get_string(u, "screen_name"))
//                     .collect();

//                 let urls = json_path::get_array(data, "urls")
//                     .unwrap_or_default()
//                     .iter()
//                     .filter_map(|u| json_path::get_string(u, "expanded_url"))
//                     .collect();

//                 TweetEntities {
//                     hashtags,
//                     mentioned_users,
//                     urls,
//                 }
//             })
//             .unwrap_or(TweetEntities {
//                 hashtags: Vec::new(),
//                 mentioned_users: Vec::new(),
//                 urls: Vec::new(),
//             });

//         // 提取媒体信息
//         let media =
//             json_path::get_array(tweet_data, "legacy.extended_entities.media").map(|media_array| {
//                 media_array
//                     .iter()
//                     .filter_map(|media_item| {
//                         let media_type = json_path::get_string(media_item, "type")?.to_lowercase();

//                         let media_type_enum = match media_type.as_str() {
//                             "photo" => MediaType::Photo,
//                             "video" => MediaType::Video,
//                             "animated_gif" => MediaType::Gif,
//                             _ => return None,
//                         };

//                         let url = if media_type_enum == MediaType::Photo {
//                             json_path::get_string(media_item, "media_url_https")
//                         } else {
//                             // 对于视频和 GIF，选择比特率最高的变体
//                             let variants = json_path::get_array(media_item, "video_info.variants")
//                                 .unwrap_or_default();

//                             let mut highest_bitrate = 0;
//                             let mut highest_url = None;

//                             for variant in variants {
//                                 if let Some(bitrate) = json_path::get_path(&variant, "bitrate")
//                                     .and_then(|v| v.as_u64())
//                                 {
//                                     if bitrate > highest_bitrate {
//                                         highest_bitrate = bitrate;
//                                         highest_url = json_path::get_string(&variant, "url");
//                                     }
//                                 }
//                             }

//                             highest_url
//                         };

//                         let thumbnail_url = if media_type_enum != MediaType::Photo {
//                             json_path::get_string(media_item, "media_url_https")
//                         } else {
//                             None
//                         };

//                         Some(TweetMedia {
//                             thumbnail_url,
//                             r#type: media_type_enum,
//                             url: url.unwrap_or_default(),
//                         })
//                     })
//                     .collect()
//             });

//         // 提取引用的推文
//         let quoted_data = json_path::get_path(tweet_data, "quoted_status_result.result.tweet")
//             .or_else(|| json_path::get_path(tweet_data, "quoted_status_result.result"));
//         let quoted = quoted_data.as_ref().and_then(|data| {
//             if json_path::get_string(data, "__typename") == Some("TweetTombstone".to_string()) {
//                 None
//             } else {
//                 Self::from_json(data).map(Box::new)
//             }
//         });

//         // 提取转发的推文
//         let retweeted_data =
//             json_path::get_path(tweet_data, "legacy.retweeted_status_result.result.tweet").or_else(
//                 || json_path::get_path(tweet_data, "legacy.retweeted_status_result.result"),
//             );
//         let retweeted_tweet = retweeted_data.as_ref().and_then(|data| {
//             if json_path::get_string(data, "__typename") == Some("TweetTombstone".to_string()) {
//                 None
//             } else {
//                 Self::from_json(data).map(Box::new)
//             }
//         });

//         // 提取回复给的推文ID
//         let reply_to = json_path::get_string(tweet_data, "legacy.in_reply_to_status_id_str");

//         // 构建Tweet URL
//         let url = if let (Some(username), Some(id)) = (
//             author.as_ref().map(|a| a.user_name.clone()),
//             rest_id.clone(),
//         ) {
//             format!("https://x.com/{}/status/{}", username, id)
//         } else {
//             String::new()
//         };

//         // 检查必要字段
//         if rest_id.is_none()
//             || created_at.is_none()
//             || full_text.is_none()
//             || lang.is_none()
//             || conversation_id.is_none()
//             || author.is_none()
//         {
//             return None;
//         }

//         // 创建Tweet实例
//         Some(Tweet {
//             bookmark_count,
//             conversation_id: conversation_id.unwrap(),
//             created_at: created_at.unwrap(),
//             entities,
//             full_text: full_text.unwrap(),
//             id: rest_id.unwrap(),
//             lang: lang.unwrap(),
//             like_count,
//             media,
//             quote_count,
//             quoted,
//             reply_count,
//             reply_to,
//             retweet_count,
//             retweeted_tweet,
//             tweet_by: author.unwrap(),
//             url,
//             view_count,
//         })
//     }

//     /// 从JSON数据中提取推文列表
//     pub fn list(response: &Value) -> Vec<Self> {
//         let mut tweets = Vec::new();

//         // 使用json_path获取entries数组
//         const INSTRUCTIONS_PATH: &str = "data.user.result.timeline.timeline.instructions";
//         const ENTRIES_PATH: &str = "data.user.result.timeline.timeline.instructions.0.entries";
//         const ENTRIES_TYPE: &str = "data.user.result.timeline.timeline.instructions.0.type";

//         let instruction_type: Option<EntriesType> = json_path::get_string(response, ENTRIES_TYPE)
//             .and_then(|type_str| serde_json::from_value(Value::String(type_str)).ok());

//         if let Some(entries) = json_path::get_array(response, ENTRIES_PATH) {
//             // 用 filter_map 把所有“合法”的 tweet 提取出来并 push 进 tweets
//             tweets.extend(entries.iter().filter_map(|entry| {
//                 // 1. 跳过游标项
//                 let entry_id = entry.get("entryId").and_then(|v| v.as_str())?;
//                 if entry_id.contains("cursor-bottom") {
//                     return None;
//                 }

//                 // 2. 拿到 tweet_data
//                 let tweet_data =
//                     json_path::get_path(entry, "content.itemContent.tweet_results.result.tweet")
//                         .or_else(|| {
//                             json_path::get_path(entry, "content.itemContent.tweet_results.result")
//                         })?;

//                 // 3. 过滤已删除推文（TweetTombstone）
//                 if tweet_data.get("__typename").and_then(|v| v.as_str()) == Some("TweetTombstone") {
//                     return None;
//                 }

//                 // 4. 过滤广告
//                 if tweet_data
//                     .get("source")
//                     .and_then(|v| v.as_str())
//                     .map_or(false, |s| s.contains("Advertisers"))
//                 {
//                     return None;
//                 }

//                 // 5. 最后尝试从 JSON 构造 Tweet
//                 Self::from_json(&tweet_data)
//             }));
//         }
//         tweets
//     }

//     /// 将自身转换为JSON
//     pub fn to_json(&self) -> Value {
//         serde_json::to_value(self).unwrap_or(Value::Null)
//     }
// }
