use super::enums::authentication::EAuthentication;
use super::enums::login::{ELoginUrls, Tokens};
use super::models::credentials::AuthCredential;
use crate::domain::models::userkv::{get_userkv_value, UserKey};
use anyhow::{Context, Result};
use async_trait::async_trait;
use reqwest::Client;

#[async_trait]
pub trait AuthGenerator: Send + Sync {
    async fn generate(&self) -> Result<AuthCredential>;
}

/// 生成访客（Guest）认证
pub struct GuestAuth;

#[async_trait]
impl AuthGenerator for GuestAuth {
    async fn generate(&self) -> Result<AuthCredential> {
        let client = Client::new();
        let resp = client
            .post(ELoginUrls::GuestToken.as_str())
            .bearer_auth(Tokens::AuthToken.as_str())
            .send()
            .await
            .context("Failed to request guest token")?;

        let status = resp.status();
        if !status.is_success() {
            anyhow::bail!("Failed to get guest token: HTTP {}", status);
        }

        let body: GuestTokenResponse = resp
            .json()
            .await
            .context("Failed to parse guest token response")?;

        Ok(AuthCredential::guest(body.guest_token))
    }
}

/// 生成用户（User）认证
pub struct UserAuth;

#[async_trait]
impl AuthGenerator for UserAuth {
    async fn generate(&self) -> Result<AuthCredential> {
        let raw = get_userkv_value(UserKey::Twitter)
            .await
            .context("Failed to read stored Twitter cookie")?;
        let cookie = raw.ok_or_else(|| anyhow::anyhow!("No Twitter cookie found"))?;
        AuthCredential::user(cookie)
    }
}

/// 根据认证类型创建对应的 AuthGenerator
pub fn auth_generator_for(auth_type: EAuthentication) -> Box<dyn AuthGenerator> {
    match auth_type {
        EAuthentication::Guest => Box::new(GuestAuth),
        EAuthentication::User => Box::new(UserAuth),
    }
}

// 内部结构体，仅供反序列化
#[derive(serde::Deserialize)]
struct GuestTokenResponse {
    guest_token: String,
}
