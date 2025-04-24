use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use specta::Type;

use super::enums::BaseType;
// use super::tweet::Tweet;
use super::user::User;
use super::utils::find_by_filter;
use crate::domain::models::twitter::like::LikedPost;
use crate::domain::platform::twitter::api::models::enums::EntriesType;
use crate::utils::json_path;

/// 游标数据结构，用于分页
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CursoredData<T> {
    /// 数据列表
    pub list: Vec<T>,

    /// 下一页游标
    pub next: String,
}

impl CursoredData<LikedPost> {
    pub fn from_response(response: &Value) -> Result<Self> {
        let instruction = match json_path::get_path(
            response,
            "data.user.result.timeline.timeline.instructions.0",
        ) {
            Value::Null => json_path::get_path(response, "data.user.result.timeline.instructions.0"),
            v => v,
        };
        json_path::get_string(&instruction, "type")
            .and_then(|type_str| serde_json::from_value(Value::String(type_str)).ok())
            .map(|e: EntriesType| e == EntriesType::TimelineAddEntries)
            .ok_or_else(|| anyhow::anyhow!("cannot find timeline.instructions[0].type"))?;
        let entries = json_path::get_array(&instruction, "entries")
            .ok_or_else(|| anyhow::anyhow!("cannot find timeline.instructions[0].entries"))?;
        let (list, next) = entries.iter().fold(
            (Vec::new(), String::new()),
            |(mut list, mut next), entry| {
                if let Some(entry_id) = entry.get("entryId").and_then(|v| v.as_str()) {
                    if entry_id.contains("cursor-bottom") {
                        if let Some(cursor_value) = json_path::get_string(&entry, "content.value") {
                            next = cursor_value;
                        }
                    } else if let Some(post) = LikedPost::from_json(entry) {
                        list.push(post);
                    }
                }
                (list, next)
            },
        );

        Ok(Self { list, next })
    }

    /// 将自身转换为JSON
    pub fn to_json(&self) -> Value {
        serde_json::to_value(self).unwrap_or(Value::Null)
    }
}

