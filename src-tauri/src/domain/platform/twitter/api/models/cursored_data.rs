use std::collections::HashSet;

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use specta::Type;
use surrealdb::RecordId;

use crate::database::Crud;
use crate::domain::models::twitter::like::LikedPost;
use crate::domain::models::twitter::post::DbPost;
use crate::domain::platform::twitter::api::models::enums::EntriesType;

/// 游标数据结构，用于分页
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CursoredData<T> {
    pub list: Vec<T>,
    pub next: String,
    pub is_end: bool,
}

impl CursoredData<LikedPost> {
    pub async fn from_response(
        response: &Value,
        sort_ref: Option<u32>,
        exist: Vec<RecordId>,
    ) -> Result<Self> {
        let seen: HashSet<RecordId> = exist.into_iter().collect();
        let mut seen_streak = 0; // 连续 seen 的个数
        let streak_threshold = 5;

        let instruction = response
            .pointer("/data/user/result/timeline/timeline/instructions/0")
            .or_else(|| response.pointer("/data/user/result/timeline/instructions/0"))
            .context("can not find timeline.instructions[0]")?;
        instruction
            .get("type")
            .and_then(|v| v.as_str())
            .and_then(|type_str| serde_json::from_value(Value::String(type_str.to_string())).ok())
            .map(|e: EntriesType| e == EntriesType::TimelineAddEntries)
            .context("timeline.instructions[0].type is not TimelineAddEntries")?;
        let entries = instruction
            .get("entries")
            .and_then(Value::as_array)
            .context("cannot find timeline.instructions[0].entries")?;
        let mut list = Vec::with_capacity(entries.len());
        let mut next = String::new();
        let mut is_end = false;
        if entries.len() == 0 {
            is_end = true;
        }
        for entry in entries {
            // 找 cursor-bottom
            if let Some(entry_id) = entry.pointer("/entryId").and_then(Value::as_str) {
                if entry_id.contains("cursor-bottom") {
                    if let Some(c) = entry.pointer("/content/value").and_then(Value::as_str) {
                        next = c.to_string();
                    }
                    continue;
                } else if entry_id.contains("cursor-top") {
                    continue;
                }
            }
            // 解析出一个 LikedPost
            if let Some(liked) = LikedPost::from_api(&entry) {
                let key = DbPost::record_id(liked.post.rest_id);
                if seen.contains(&key) {
                    seen_streak += 1;
                    if seen_streak >= streak_threshold {
                        is_end = true;
                        println!("seen streak reached threshold, break");
                        break; // 连续n条已存在，终止
                    }
                    continue; // 跳过本条
                }
                seen_streak = 0;
                list.push(liked);
            }
        }

        let base_ts = match sort_ref {
            Some(v) => v as i64,
            None => chrono::Utc::now().timestamp_millis(),
        };
        for (i, post) in list.iter_mut().enumerate() {
            post.sortidx = (base_ts - (i as i64)) as u32;
        }

        Ok(Self { list, next, is_end })
    }

    /// 将自身转换为JSON
    pub fn to_json(&self) -> Value {
        serde_json::to_value(self).unwrap_or(Value::Null)
    }
}
