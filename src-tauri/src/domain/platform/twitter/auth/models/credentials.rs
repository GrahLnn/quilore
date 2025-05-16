use super::super::enums::authentication::EAuthentication;
use super::super::enums::login::Tokens;
use super::authcookie::AuthCookie;
use anyhow::Result;
use reqwest::header::{HeaderMap, HeaderValue};

/// 认证凭证
#[derive(Debug, Clone)]
pub struct AuthCredential {
    token: String,
    guest_token: Option<String>,
    csrf_token: Option<String>,
    pub cookie: Option<AuthCookie>,
    auth_type: EAuthentication,
}

impl AuthCredential {
    /// 构建访客凭证
    pub fn guest(guest_token: String) -> Self {
        AuthCredential {
            token: Tokens::AuthToken.as_str().to_string(),
            guest_token: Some(guest_token),
            csrf_token: None,
            cookie: None,
            auth_type: EAuthentication::Guest,
        }
    }

    /// 构建用户凭证
    pub fn user(raw_cookie: String) -> Result<Self> {
        let parsed = AuthCookie::parse(&raw_cookie);
        let ct0 = parsed.ct0.clone();
        // let cookie = parsed.collect_fields();
        Ok(AuthCredential {
            token: Tokens::AuthToken.as_str().to_string(),
            guest_token: None,
            csrf_token: ct0,
            cookie: Some(parsed),
            auth_type: EAuthentication::User,
        })
    }

    /// 转换为 HTTP 头
    pub fn headers(&self) -> HeaderMap {
        let mut headers = HeaderMap::new();
        // 通用授权头
        headers.insert(
            "authorization",
            HeaderValue::from_str(&format!("Bearer {}", &self.token)).unwrap(),
        );

        // 访客 token
        if let Some(gt) = &self.guest_token {
            headers.insert("x-guest-token", HeaderValue::from_str(gt).unwrap());
        }

        // CSRF token
        if let Some(csrf) = &self.csrf_token {
            headers.insert("x-csrf-token", HeaderValue::from_str(csrf).unwrap());
        }

        // Cookie
        if let Some(cookie) = &self.cookie {
            headers.insert(
                "cookie",
                HeaderValue::from_str(&cookie.collect_fields()).unwrap(),
            );
        }

        headers
    }
}
