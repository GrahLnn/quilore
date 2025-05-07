use crate::database::enums::table::Table;
use crate::database::{Crud, HasId};
use crate::domain::models::meta::GlobalVal;
use crate::enums::platform::Platform;
use crate::{impl_crud, impl_id};

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use specta::Type;
use surrealdb::RecordId;
use url::Url;

use super::asset::{Asset, AssetType, DbAsset};

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct MediaBase {
    pub id: String,
    pub asset: Asset,
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
    pub thumb: Asset,
    pub duration_millis: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct AnimatedGifMedia {
    #[serde(flatten)]
    pub base: MediaBase,

    pub aspect_ratio: (u32, u32),
    pub thumb: Asset,
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
    pub asset: RecordId,
    pub description: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,

    // 如果是 video/animated_gif 才需要
    pub aspect_ratio: Option<(u32, u32)>,
    pub thumb: Option<RecordId>,
    pub duration_millis: Option<u32>,
}

impl_crud!(DbMedia, Table::Media);
impl_id!(DbMedia, id);

impl Media {
    pub fn from_api(json: &Value) -> Option<Self> {
        // 1. 先拿到 type 字段
        let media_type = json.get("type")?.as_str()?;

        // 2. 根据 type 分支处理
        match media_type {
            "photo" => {
                // 对应照片
                let original_url = json.get("media_url_https")?.as_str()?.to_string();
                let id = Url::parse(&original_url)
                    .ok()?
                    .path_segments()?
                    .last()?
                    .to_string();
                let parsed_url = Url::parse(&original_url).ok()?;
                let basename = parsed_url.path_segments()?.last()?;
                let parts: Vec<&str> = basename.split('.').collect();
                let asset_name = parts.first()?;
                let extension = parts.last()?;

                // 构建高分辨率 URL
                let url = format!(
                    "https://pbs.twimg.com/media/{}?format={}&name=4096x4096",
                    asset_name, extension
                );
                let width = json
                    .pointer("/original_info/width")
                    .and_then(Value::as_u64)
                    .map(|v| v as u32);
                let height = json
                    .pointer("/original_info/height")
                    .and_then(Value::as_u64)
                    .map(|v| v as u32);
                let base_path = GlobalVal::get_save_dir()?;
                let path = base_path
                    .join("media")
                    .join(id.clone())
                    .to_string_lossy()
                    .to_string();
                let asset = Asset {
                    ty: AssetType::Media,
                    plat: Platform::Twitter,
                    url: url.clone(),
                    name: id.clone(),
                    path,
                    downloaded: false,
                    available: false,
                };

                Some(Media::Photo(PhotoMedia {
                    base: MediaBase {
                        id: id.clone(),
                        asset,
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
                let base_path = GlobalVal::get_save_dir()?;
                let path = base_path
                    .join(AssetType::Media.as_str())
                    .join(id.clone())
                    .to_string_lossy()
                    .to_string();
                let asset = Asset {
                    ty: AssetType::Media,
                    plat: Platform::Twitter,
                    url: url.clone(),
                    name: id.clone(),
                    path,
                    downloaded: false,
                    available: false,
                };

                let base = MediaBase {
                    id: id.clone(),
                    asset,
                    description: None,
                    width,
                    height,
                };

                // 解析宽高比
                let arr = json.get("video_info")?.get("aspect_ratio")?.as_array()?;
                let aspect_ratio = (arr.get(0)?.as_u64()? as u32, arr.get(1)?.as_u64()? as u32);

                // 缩略图
                let thumb_url = json.get("media_url_https")?.as_str()?.to_string();
                let thumb_name = Url::parse(&thumb_url)
                    .ok()?
                    .path_segments()?
                    .last()?
                    .to_string();
                let base_path = GlobalVal::get_save_dir()?;
                let path = base_path
                    .join(AssetType::Thumb.as_str())
                    .join(thumb_name.clone())
                    .to_string_lossy()
                    .to_string();
                let thumb = Asset {
                    ty: AssetType::Thumb,
                    plat: Platform::Twitter,
                    url: thumb_url,
                    name: thumb_name,
                    path,
                    downloaded: false,
                    available: false,
                };

                if media_type == "video" {
                    // 只有 video 有 duration
                    let duration_millis =
                        json.get("video_info")?.get("duration_millis")?.as_u64()? as u32;

                    Some(Media::Video(VideoMedia {
                        base,
                        aspect_ratio,
                        thumb,
                        duration_millis,
                    }))
                } else {
                    // animated_gif
                    Some(Media::AnimatedGif(AnimatedGifMedia {
                        base,
                        aspect_ratio,
                        thumb,
                    }))
                }
            }

            _ => None,
        }
    }

    pub fn get_asset(self) -> Asset {
        match self {
            Media::Photo(photo) => photo.base.asset,
            Media::Video(video) => video.base.asset,
            Media::AnimatedGif(gif) => gif.base.asset,
        }
    }

    pub fn get_thumb(self) -> Option<Asset> {
        match self {
            Media::Photo(_) => None,
            Media::Video(video) => Some(video.thumb),
            Media::AnimatedGif(gif) => Some(gif.thumb),
        }
    }

    pub fn into_db(self) -> DbMedia {
        DbMedia::from_domain(self)
    }
}

impl DbMedia {
    pub async fn convert_asset(id: RecordId) -> Result<Asset> {
        DbAsset::get(id).await
    }

    pub async fn into_domain(self) -> Result<Media> {
        let asset = DbAsset::get(self.asset).await?;
        let base = MediaBase {
            id: self.id.to_string(),
            asset,
            description: self.description,
            width: self.width,
            height: self.height,
        };
        match self.media_type.as_str() {
            "photo" => Ok(Media::Photo(PhotoMedia { base })),
            "video" => Ok(Media::Video(VideoMedia {
                base,
                aspect_ratio: self.aspect_ratio.unwrap_or((16, 9)),
                thumb: DbAsset::get(self.thumb.unwrap()).await?,
                duration_millis: self.duration_millis.unwrap_or(0),
            })),
            "animated_gif" => Ok(Media::AnimatedGif(AnimatedGifMedia {
                base,
                aspect_ratio: self.aspect_ratio.unwrap_or((16, 9)),

                thumb: DbAsset::get(self.thumb.unwrap()).await?,
            })),
            _ => Err(anyhow::anyhow!("未知的 media_type: {}", self.media_type)),
        }
    }

    pub fn from_domain(media: Media) -> DbMedia {
        match media {
            Media::Photo(photo) => {
                let base = photo.base;

                DbMedia {
                    id: DbMedia::record_id(&base.id),
                    media_type: "photo".into(),
                    asset: DbAsset::from_domain(base.asset).id,
                    description: base.description,
                    width: base.width,
                    height: base.height,
                    aspect_ratio: None,
                    thumb: None,
                    duration_millis: None,
                }
            }
            Media::Video(video) => {
                let base = video.base;
                DbMedia {
                    id: DbMedia::record_id(&base.id),
                    media_type: "video".into(),
                    asset: DbAsset::from_domain(base.asset).id,
                    description: base.description,
                    aspect_ratio: Some(video.aspect_ratio),
                    width: base.width,
                    height: base.height,
                    thumb: Some(DbAsset::from_domain(video.thumb).id),
                    duration_millis: Some(video.duration_millis),
                }
            }
            Media::AnimatedGif(gif) => {
                let base = gif.base;
                DbMedia {
                    id: DbMedia::record_id(&base.id),
                    media_type: "animated_gif".into(),
                    asset: DbAsset::from_domain(base.asset).id,
                    description: base.description,
                    aspect_ratio: Some(gif.aspect_ratio),
                    width: base.width,
                    height: base.height,
                    thumb: Some(DbAsset::from_domain(gif.thumb).id),
                    duration_millis: None,
                }
            }
        }
    }

    pub async fn get(id: RecordId) -> Result<Media> {
        let data: DbMedia = DbMedia::select_record(id).await?;
        data.into_domain().await
    }
}
