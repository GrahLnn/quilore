use reqwest::Method;

pub struct Payload {
    pub method: Method,
    pub url: String,
    pub params: Params,
}

pub struct Params {
    pub features: String,
    pub variables: String,
}


impl Params {
    pub fn to_string(&self) -> String {
        // 使用URL编码处理参数值
        let encoded_features = urlencoding::encode(&self.features);
        let encoded_variables = urlencoding::encode(&self.variables);
        format!("features={}&variables={}", encoded_features, encoded_variables)
    }
}
