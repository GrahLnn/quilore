use crate::database::enums::table::Table;
use crate::database::{Crud, HasId};
use crate::{impl_crud, impl_id};
use anyhow::{Error, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use specta::Type;
use surrealdb::RecordId;
use url::Url;

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct MediaBase {
    pub id: String,
    pub url: String,
    pub path: String,
    pub description: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct PhotoMedia {
    #[serde(flatten)]
    pub base: MediaBase,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct VideoMedia {
    #[serde(flatten)]
    pub base: MediaBase,

    pub aspect_ratio: (u32, u32),
    pub thumb: String,
    pub thumb_path: Option<String>,
    pub duration_millis: u32,
    pub bitrate: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct AnimatedGifMedia {
    #[serde(flatten)]
    pub base: MediaBase,

    pub aspect_ratio: (u32, u32),
    pub thumb: String,
    pub thumb_path: Option<String>,
    pub bitrate: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Media {
    #[serde(rename = "photo")]
    Photo(PhotoMedia),

    #[serde(rename = "video")]
    Video(VideoMedia),

    #[serde(rename = "animated_gif")]
    AnimatedGif(AnimatedGifMedia),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbMedia {
    pub id: RecordId,
    pub media_type: String, // "photo" | "video" | "animated_gif"
    pub url: String,
    pub path: String,
    pub description: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,

    // 如果是 video/animated_gif 才需要
    pub aspect_ratio: Option<(u32, u32)>,
    pub thumb: Option<String>,
    pub thumb_path: Option<String>,
    pub duration_millis: Option<u32>,
    pub bitrate: Option<u32>,
}

impl_crud!(DbMedia, Table::Media);
impl_id!(DbMedia, id);

impl Media {
    pub fn from_json(json: &Value) -> Option<Self> {
        // 1. 先拿到 type 字段
        let media_type = json.get("type")?.as_str()?;

        // 2. 根据 type 分支处理
        match media_type {
            "photo" => {
                // 对应照片
                let url = json.get("media_url_https")?.as_str()?.to_string();
                let id = Url::parse(&url).ok()?.path_segments()?.last()?.to_string();
                let width = json
                    .get("original_info")?
                    .get("width")
                    .and_then(Value::as_u64)
                    .map(|v| v as u32);
                let height = json
                    .get("original_info")?
                    .get("height")
                    .and_then(Value::as_u64)
                    .map(|v| v as u32);

                Some(Media::Photo(PhotoMedia {
                    base: MediaBase {
                        id: id.clone(),
                        url: url.clone(),
                        path: id,
                        description: None,
                        width,
                        height,
                    },
                }))
            }

            "video" | "animated_gif" => {
                // 拿到所有变体
                let variants = json
                    .get("video_info")?
                    .get("variants")?
                    .as_array()
                    .cloned()
                    .unwrap_or_default();

                // 选 bitrate 最大的那个
                let best = variants
                    .iter()
                    .max_by_key(|v| v.get("bitrate").and_then(Value::as_u64).unwrap_or(0))?;

                let url = best.get("url")?.as_str()?.to_string();
                let bitrate = best
                    .get("bitrate")
                    .and_then(Value::as_u64)
                    .map(|v| v as u32);
                let id = Url::parse(&url).ok()?.path_segments()?.last()?.to_string();

                // 公共 base 字段
                let width = json
                    .get("original_info")?
                    .get("width")
                    .and_then(Value::as_u64)
                    .map(|v| v as u32);
                let height = json
                    .get("original_info")?
                    .get("height")
                    .and_then(Value::as_u64)
                    .map(|v| v as u32);

                let base = MediaBase {
                    id: id.clone(),
                    url: url.clone(),
                    path: id,
                    description: None,
                    width,
                    height,
                };

                // 解析宽高比
                let arr = json.get("video_info")?.get("aspect_ratio")?.as_array()?;
                let aspect_ratio = (arr.get(0)?.as_u64()? as u32, arr.get(1)?.as_u64()? as u32);

                // 缩略图
                let thumb = json.get("media_url_https")?.as_str()?.to_string();

                if media_type == "video" {
                    // 只有 video 有 duration
                    let duration_millis =
                        json.get("video_info")?.get("duration_millis")?.as_u64()? as u32;

                    Some(Media::Video(VideoMedia {
                        base,
                        aspect_ratio,
                        thumb,
                        thumb_path: None,
                        duration_millis,
                        bitrate,
                    }))
                } else {
                    // animated_gif
                    Some(Media::AnimatedGif(AnimatedGifMedia {
                        base,
                        aspect_ratio,
                        thumb,
                        thumb_path: None,
                        bitrate,
                    }))
                }
            }

            _ => None,
        }
    }
}

impl DbMedia {
    pub fn into_domain(self) -> Result<Media> {
        let base = MediaBase {
            id: self.id.to_string(),
            url: self.url,
            path: self.path,
            description: self.description,
            width: self.width,
            height: self.height,
        };
        match self.media_type.as_str() {
            "photo" => Ok(Media::Photo(PhotoMedia { base })),
            "video" => Ok(Media::Video(VideoMedia {
                base,
                aspect_ratio: self.aspect_ratio.unwrap_or((16, 9)),
                thumb: self.thumb.unwrap_or_default(),
                thumb_path: self.thumb_path,
                duration_millis: self.duration_millis.unwrap_or(0),
                bitrate: self.bitrate,
            })),
            "animated_gif" => Ok(Media::AnimatedGif(AnimatedGifMedia {
                base,
                aspect_ratio: self.aspect_ratio.unwrap_or((16, 9)),
                thumb: self.thumb.unwrap_or_default(),
                thumb_path: self.thumb_path,
                bitrate: self.bitrate,
            })),
            _ => Err(anyhow::anyhow!("未知的 media_type: {}", self.media_type)),
        }
    }

    pub fn from_domain(media: Media) -> Result<DbMedia> {
        match media {
            Media::Photo(photo) => {
                let base = photo.base;
                Ok(DbMedia {
                    id: DbMedia::record_id(&base.id),
                    media_type: "photo".into(),
                    url: base.url,
                    path: base.path,
                    description: base.description,
                    width: base.width,
                    height: base.height,
                    aspect_ratio: None,
                    thumb: None,
                    thumb_path: None,
                    duration_millis: None,
                    bitrate: None,
                })
            }
            Media::Video(video) => {
                let base = video.base;
                Ok(DbMedia {
                    id: DbMedia::record_id(&base.id),
                    media_type: "video".into(),
                    url: base.url,
                    path: base.path,
                    description: base.description,
                    aspect_ratio: Some(video.aspect_ratio),
                    width: base.width,
                    height: base.height,
                    thumb: Some(video.thumb),
                    thumb_path: video.thumb_path,
                    duration_millis: Some(video.duration_millis),
                    bitrate: video.bitrate,
                })
            }
            Media::AnimatedGif(gif) => {
                let base = gif.base;
                Ok(DbMedia {
                    id: DbMedia::record_id(&base.id),
                    media_type: "animated_gif".into(),
                    url: base.url,
                    path: base.path,
                    description: base.description,
                    aspect_ratio: Some(gif.aspect_ratio),
                    width: base.width,
                    height: base.height,
                    thumb: Some(gif.thumb),
                    thumb_path: gif.thumb_path,
                    duration_millis: None,
                    bitrate: gif.bitrate,
                })
            }
        }
    }

    pub async fn get(id: RecordId) -> Result<Media> {
        let data: DbMedia = DbMedia::select_record(id).await?;
        data.into_domain()
    }
}
