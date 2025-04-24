use serde_json::Value;

#[derive(Debug, Clone)]
pub struct AuthCookie {
    pub raw: Vec<(String, String)>,
    pub ct0: Option<String>,        // csrf token
    pub twid: Option<String>,       // twitter id
    pub auth_token: Option<String>, // authentication token
    pub kdt: Option<String>,        // known devices token
}

impl AuthCookie {
    /// 自动识别格式并解析
    pub fn parse(input: &str) -> Self {
        let raw = if let Ok(json) = serde_json::from_str::<Value>(input) {
            // 1. JSON 格式处理
            if let Some(obj) = json.as_object() {
                obj.iter()
                    .filter_map(|(k, v)| v.as_str().map(|v_str| (k.clone(), v_str.to_string())))
                    .collect()
            } else {
                Vec::new()
            }
        } else if input.contains('=') && input.contains(';') {
            // 2. Header string 格式处理 (ct0=xxx; auth_token=yyy)
            input
                .split(';')
                .filter_map(|s| {
                    let parts: Vec<_> = s.trim().splitn(2, '=').collect();
                    if parts.len() == 2 {
                        Some((parts[0].trim().to_string(), parts[1].trim().to_string()))
                    } else {
                        None
                    }
                })
                .collect()
        } else {
            // 3. Netscape HTTP Cookie File 格式处理
            input
                .lines()
                .filter(|line| !line.trim().starts_with('#') && !line.trim().is_empty())
                .filter_map(|line| {
                    let cols: Vec<&str> = line.split('\t').collect();
                    if cols.len() >= 7 {
                        Some((cols[5].to_string(), cols[6].to_string()))
                    } else {
                        None
                    }
                })
                .collect()
        };

        // 提取所需的特定字段
        let find_value = |key: &str| -> Option<String> {
            raw.iter().find(|(k, _)| k == key).map(|(_, v)| v.clone())
        };

        Self {
            ct0: find_value("ct0"),
            twid: find_value("twid"),
            auth_token: find_value("auth_token"),
            kdt: find_value("kdt"),
            raw,
        }
    }

    /// 输出为标准 header 格式字符串
    pub fn to_string(&self) -> String {
        self.raw
            .iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect::<Vec<_>>()
            .join("; ")
    }

    /// 检查是否包含所有必需的字段
    pub fn is_valid(&self) -> bool {
        self.ct0.is_some() && self.twid.is_some() && self.auth_token.is_some() && self.kdt.is_some()
    }

    pub fn collect_fields(&self) -> String {
        let mut fields = Vec::new();

        if let Some(ct0) = &self.ct0 {
            fields.push(("ct0".to_string(), ct0.clone()));
        }

        if let Some(twid) = &self.twid {
            fields.push(("twid".to_string(), twid.clone()));
        }

        if let Some(auth_token) = &self.auth_token {
            fields.push(("auth_token".to_string(), auth_token.clone()));
        }

        if let Some(kdt) = &self.kdt {
            fields.push(("kdt".to_string(), kdt.clone()));
        }

        fields
            .iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect::<Vec<_>>()
            .join("; ")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_header_string() {
        let input = "ct0=123; auth_token=456; twid=789; kdt=abc";
        let cookie = AuthCookie::parse(input);
        assert_eq!(cookie.ct0, Some("123".to_string()));
        assert_eq!(cookie.auth_token, Some("456".to_string()));
        assert_eq!(cookie.twid, Some("789".to_string()));
        assert_eq!(cookie.kdt, Some("abc".to_string()));
        assert!(cookie.is_valid());
    }

    #[test]
    fn test_parse_json() {
        let input = r#"{"ct0":"123","auth_token":"456","twid":"789","kdt":"abc"}"#;
        let cookie = AuthCookie::parse(input);
        assert_eq!(cookie.ct0, Some("123".to_string()));
        assert_eq!(cookie.auth_token, Some("456".to_string()));
        assert_eq!(cookie.twid, Some("789".to_string()));
        assert_eq!(cookie.kdt, Some("abc".to_string()));
        assert!(cookie.is_valid());
    }
}
