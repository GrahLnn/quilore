use reqwest::Method;

pub struct Payload {
    pub method: Method,
    pub url: String,
    pub params: Params,
}

pub struct Params {
    pub features: String,
    pub variables: String,
    pub field_toggles: Option<String>,
}

impl Params {
    pub fn to_string(&self) -> String {
        // 使用URL编码处理参数值
        let encoded_features = urlencoding::encode(&self.features);
        let encoded_variables = urlencoding::encode(&self.variables);

        let base = format!(
            "features={}&variables={}",
            encoded_features, encoded_variables
        );

        // 处理可选的field_toggles
        if let Some(field_toggles) = &self.field_toggles {
            let encoded_field_toggles = urlencoding::encode(field_toggles);
            format!("{}&fieldToggles={}", base, encoded_field_toggles)
        } else {
            base
        }
    }
}
