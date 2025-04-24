use super::models::enums::BaseType;
use super::models::{cursored_data, CursoredData};
use super::requests::user;
use crate::domain::platform::twitter::auth::auth::{self, AuthGenerator};
use crate::{domain::models::twitter::like::LikedPost, utils::json_path};
use serde_json::Value;

// use anyhow::Result;

#[tauri::command]
#[specta::specta]
pub async fn likes(
    count: Option<u32>,
    cursor: Option<String>,
) -> Result<CursoredData<LikedPost>, String> {
    let cred = auth::UserAuth.generate().await.map_err(|e| e.to_string())?;
    let req = user::likes(
        cred.clone()
            .cookie
            .unwrap()
            .twid
            .unwrap()
            .replace("u%3D", ""),
        count,
        cursor,
    );
    let client = reqwest::Client::new();

    // 构建URL并添加查询参数，而不是将参数放在body中
    let mut url = reqwest::Url::parse(&req.url).map_err(|e| e.to_string())?;
    url.set_query(Some(&req.params.to_string()));

    let resp = client
        .request(req.method, url.clone())
        .headers(cred.headers())
        .send()
        .await
        .map_err(|e| format!("request failed: {}", e))?;

    // 检查响应状态
    if !resp.status().is_success() {
        return Err(format!("error code: {}, URL: {}", resp.status(), url));
    }

    // 解析JSON响应
    let json_data = resp
        .json::<Value>()
        .await
        .map_err(|e| format!("failed to parse JSON: {e}"))?;

    // 将原始响应转换为结构化的CursoredData
    let result = CursoredData::<LikedPost>::from_response(&json_data).map_err(|e| e.to_string())?;
    dbg!(result.clone());
    // 返回结果
    Ok(result)
}
