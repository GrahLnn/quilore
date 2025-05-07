use crate::domain::models::twitter::asset::{Asset, AssetType};
use crate::domain::models::twitter::media::{
    AnimatedGifMedia, Media, MediaBase, PhotoMedia, VideoMedia,
};
use crate::domain::models::twitter::post::QuotePost;
use crate::domain::models::twitter::users::User;
use crate::domain::models::twitter::{
    like::LikedPost,
    post::{Article, Card, Content, Conversation, Post, Reply},
};
use crate::enums::platform::Platform;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::PathBuf;
use std::{fs::File, io::BufReader};

#[derive(Debug, Serialize, Deserialize)]
pub struct TweetMetaData {
    pub item: String,
    pub created_at: String,
    pub proj_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TweetData {
    pub metadata: TweetMetaData,
    pub results: Vec<LikedPost>,
}

pub fn read_tweets_from_json(file_path: PathBuf) -> Result<TweetData> {
    // 打开文件
    let file = File::open(file_path)?;
    let reader = BufReader::new(file);

    // 解析JSON
    let tweets: Value = serde_json::from_reader(reader)?;
    let metadata = TweetMetaData {
        item: tweets
            .pointer("/metadata/item")
            .and_then(|v| v.as_str())
            .unwrap()
            .to_string(),
        created_at: tweets
            .pointer("/metadata/created_at")
            .and_then(|v| v.as_str())
            .unwrap()
            .to_string(),
        proj_path: tweets
            .pointer("/metadata/media_folder")
            .and_then(|v| v.as_str())
            .unwrap()
            .to_string(),
    };
    let results = tweets
        .pointer("/results")
        .and_then(|v| v.as_array())
        .unwrap()
        .iter()
        .filter_map(|v| des_likedpost(v))
        .collect();
    Ok(TweetData { metadata, results })
}

fn des_likedpost(json: &Value) -> Option<LikedPost> {
    let sortidx = json.pointer("/sortidx")?.as_str()?.parse::<u32>().unwrap();
    let post = json.pointer("/post").and_then(des_post)?;
    Some(LikedPost { sortidx, post })
}

fn des_post(json: &Value) -> Option<Post> {
    let replies = json
        .pointer("/replies")
        .and_then(|v| v.as_array())
        .map(|v| v.iter().map(des_conversation).collect());
    let post = Post {
        rest_id: json.pointer("/rest_id")?.as_str()?.parse::<i64>().unwrap(),
        created_at: json.pointer("/created_at")?.as_str()?.to_string(),
        author: json.pointer("/author").and_then(des_user)?,
        content: json.pointer("/content").and_then(des_content)?,
        media: json
            .pointer("/media")
            .and_then(|v| v.as_array())
            .map(|v| v.iter().filter_map(des_media).collect()),
        quote: json.pointer("/quote").and_then(des_quote),
        key_words: json
            .pointer("/key_words")
            .and_then(|v| v.as_array())
            .map(|v| {
                v.iter()
                    .filter_map(|v| v.as_str())
                    .map(|v| v.to_string())
                    .collect()
            }),
        replies,
        card: json.pointer("/card").and_then(des_card),
        article: json.pointer("/article").and_then(des_article),
    };
    Some(post)
}

fn des_quote(json: &Value) -> Option<QuotePost> {
    let rest_id = json.pointer("/rest_id")?.as_str()?.parse::<i64>().unwrap();
    let created_at = json.pointer("/created_at")?.as_str()?.to_string();
    let author = json.pointer("/author").and_then(des_user)?;

    let content = json.pointer("/content").and_then(des_content)?;
    let media = json
        .pointer("/media")
        .and_then(|v| v.as_array())
        .map(|v| v.iter().filter_map(|v| des_media(v)).collect());
    let key_words = json
        .pointer("/key_words")
        .and_then(|v| v.as_array())
        .map(|v| {
            v.iter()
                .filter_map(|v| v.as_str())
                .map(|v| v.to_string())
                .collect()
        });
    let card = json.pointer("/card").and_then(des_card);
    let article = json.pointer("/article").and_then(des_article);
    let qpost = QuotePost {
        rest_id,
        created_at,
        author,
        content,
        media,
        key_words,
        card,
        article,
    };
    Some(qpost)
}

fn des_user(json: &Value) -> Option<User> {
    let user = User {
        id: json.pointer("/screen_name")?.as_str()?.to_string(),
        name: json.pointer("/name")?.as_str()?.to_string(),
        avatar: json
            .pointer("/avatar")
            .and_then(|v| des_asset(v, AssetType::Avatar))?,
    };
    Some(user)
}

fn des_asset(json: &Value, ty: AssetType) -> Option<Asset> {
    let name = match ty {
        AssetType::Avatar => json
            .pointer("/path")
            .and_then(|v| v.as_str())
            .map(PathBuf::from)
            .and_then(|p| p.file_name()?.to_str().map(|s| s.to_string()))?,
        AssetType::Media => json
            .pointer("/path")
            .and_then(|v| v.as_str())
            .map(PathBuf::from)
            .and_then(|p| p.file_name()?.to_str().map(|s| s.to_string()))?,
        AssetType::Thumb => json
            .pointer("/thumb_path")
            .and_then(|v| v.as_str())
            .map(PathBuf::from)
            .and_then(|p| p.file_name()?.to_str().map(|s| s.to_string()))?,
    };
    let path = match ty {
        AssetType::Avatar => json.pointer("/path")?.as_str()?.to_string(),
        AssetType::Media => json.pointer("/path")?.as_str()?.to_string(),
        AssetType::Thumb => json.pointer("/thumb_path")?.as_str()?.to_string(),
    };
    let url = match ty {
        AssetType::Avatar => json.pointer("/url")?.as_str()?.to_string(),
        AssetType::Media => json.pointer("/url")?.as_str()?.to_string(),
        AssetType::Thumb => json.pointer("/thumb")?.as_str()?.to_string(),
    };
    Some(Asset {
        ty: ty.clone(),
        plat: Platform::Twitter,
        url,
        name,
        path: path.clone(),
        downloaded: true,
        available: match path {
            val if val == "media unavailable" => false,
            _ => true,
        },
    })
}

fn des_content(json: &Value) -> Option<Content> {
    Some(Content {
        lang: json.pointer("/lang")?.as_str()?.to_string(),
        text: json.pointer("/text")?.as_str()?.to_string(),
        translation: json
            .pointer("/translation")
            .and_then(|v| v.as_str())
            .map(|v| v.to_string()),
        expanded_urls: json
            .pointer("/expanded_urls")
            .and_then(|v| v.as_array())
            .map(|v| {
                v.iter()
                    .filter_map(|v| v.as_str())
                    .map(|v| v.to_string())
                    .collect()
            }),
    })
}

fn des_media(json: &Value) -> Option<Media> {
    let ty = json.get("type")?.as_str()?;
    match ty {
        "photo" => Some(Media::Photo(PhotoMedia {
            base: MediaBase {
                id: json.pointer("/id")?.as_str()?.to_string(),
                asset: des_asset(json, AssetType::Media)?,
                description: json
                    .pointer("/description")
                    .and_then(|v| v.as_str())
                    .map(|v| v.to_string()),
                width: json.pointer("/width")?.as_u64().map(|v| v as u32),
                height: json.pointer("/height")?.as_u64().map(|v| v as u32),
            },
        })),
        "video" => Some(Media::Video(VideoMedia {
            base: MediaBase {
                id: json.pointer("/id")?.as_str()?.to_string(),
                asset: des_asset(json, AssetType::Media)?,
                description: json
                    .pointer("/description")
                    .and_then(|v| v.as_str())
                    .map(|v| v.to_string()),
                width: json.pointer("/width")?.as_u64().map(|v| v as u32),
                height: json.pointer("/height")?.as_u64().map(|v| v as u32),
            },
            aspect_ratio: json
                .pointer("/aspect_ratio")?
                .as_array()?
                .iter()
                .map(|v| v.as_u64().unwrap_or(0) as u32)
                .collect::<Vec<u32>>()
                .as_slice()
                .get(0..2)
                .map(|s| (s[0], s[1]))
                .unwrap_or((0, 0)),
            thumb: des_asset(json, AssetType::Thumb)?,
            duration_millis: json.pointer("/duration_millis")?.as_u64().unwrap() as u32,
        })),
        "animated_gif" => Some(Media::AnimatedGif(AnimatedGifMedia {
            base: MediaBase {
                id: json.pointer("/id")?.as_str()?.to_string(),
                asset: des_asset(json, AssetType::Media)?,
                description: json
                    .pointer("/description")
                    .and_then(|v| v.as_str())
                    .map(|v| v.to_string()),
                width: json.pointer("/width")?.as_u64().map(|v| v as u32),
                height: json.pointer("/height")?.as_u64().map(|v| v as u32),
            },
            aspect_ratio: json
                .pointer("/aspect_ratio")?
                .as_array()?
                .iter()
                .map(|v| v.as_u64().unwrap_or(0) as u32)
                .collect::<Vec<u32>>()
                .as_slice()
                .get(0..2)
                .map(|s| (s[0], s[1]))
                .unwrap_or((0, 0)),
            thumb: des_asset(json, AssetType::Thumb)?,
        })),
        _ => panic!("未知的 media 类型: {}", ty),
    }
}

fn des_conversation(json: &Value) -> Conversation {
    let conversation = json
        .pointer("/conversation")
        .and_then(|v| v.as_array())
        .map(|v| v.iter().filter_map(des_reply).collect())
        .unwrap_or_default();
    Conversation { conversation }
}

fn des_reply(json: &Value) -> Option<Reply> {
    Some(Reply {
        0: des_quote(json)?,
    })
}

fn des_card(json: &Value) -> Option<Card> {
    Some(Card {
        title: json
            .pointer("/title")
            .and_then(|v| v.as_str())
            .map(|v| v.to_string()),
        description: json
            .pointer("/description")
            .and_then(|v| v.as_str())
            .map(|v| v.to_string()),
        url: json.pointer("/url")?.as_str()?.to_string(),
    })
}

fn des_article(json: &Value) -> Option<Article> {
    Some(Article {
        id: json.pointer("/id")?.as_str()?.to_string(),
        title: json.pointer("/title")?.as_str()?.to_string(),
        description: json
            .pointer("/description")
            .and_then(|v| v.as_str())
            .map(|v| v.to_string()),
        url: json.pointer("/url")?.as_str()?.to_string(),
    })
}
