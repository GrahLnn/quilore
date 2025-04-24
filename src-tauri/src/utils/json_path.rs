use serde_json::Value;

/// 从嵌套的JSON结构中获取值
/// 
/// # 参数
/// 
/// * `json` - JSON值
/// * `path` - 点分隔的路径，例如 "data.user.result"
/// 
/// # 返回值
/// 
/// 如果路径存在，返回对应的值；否则返回None
pub fn get_path(json: &Value, path: &str) -> Value {
    let parts: Vec<&str> = path.split('.').collect();
    let mut current = json;
    
    for part in parts {
        // 处理数组索引，例如 "instructions.0"
        if let Ok(index) = part.parse::<usize>() {
            if let Some(array) = current.as_array() {
                if index < array.len() {
                    current = &array[index];
                } else {
                    return Value::Null;
                }
            } else {
                return Value::Null;
            }
        } else {
            // 处理对象属性
            if let Some(obj) = current.as_object() {
                if let Some(value) = obj.get(part) {
                    current = value;
                } else {
                    return Value::Null;
                }
            } else {
                return Value::Null;
            }
        }
    }
    
    current.clone()
}

/// 宏：从嵌套的JSON结构中获取值
/// 
/// # 示例
/// 
/// ```
/// let json = serde_json::json!({
///     "data": {
///         "user": {
///             "result": {
///                 "name": "John"
///             }
///         }
///     }
/// });
/// 
/// let name = json_get!(json, "data.user.result.name");
/// assert_eq!(name, Some(serde_json::json!("John")));
/// ```
#[macro_export]
macro_rules! json_get {
    ($json:expr, $path:expr) => {
        crate::domain::platform::twitter::api::models::json_path::get_path(&$json, $path)
    };
}

/// 从嵌套的JSON结构中获取字符串值
pub fn get_string(json: &Value, path: &str) -> Option<String> {
    // get_path(json, path).and_then(|v| v.as_str().map(|s| s.to_string()))
    match get_path(json, path) {
        Value::Null => None,
        Value::String(s) => Some(s.clone()),
        _ => None,
    }
}

/// 从嵌套的JSON结构中获取整数值
pub fn get_i64(json: &Value, path: &str) -> Option<i64> {
    // get_path(json, path).and_then(|v| v.as_i64())
    match get_path(json, path) {
        Value::Null => None,
        Value::Number(n) => n.as_i64(),
        _ => None,
    }
}

/// 从嵌套的JSON结构中获取浮点数值
pub fn get_f64(json: &Value, path: &str) -> Option<f64> {
    // get_path(json, path).and_then(|v| v.as_f64())
    match get_path(json, path) {
        Value::Null => None,
        Value::Number(n) => n.as_f64(),
        _ => None,
    }
}

/// 从嵌套的JSON结构中获取布尔值
pub fn get_bool(json: &Value, path: &str) -> Option<bool> {
    // get_path(json, path).and_then(|v| v.as_bool())
    match get_path(json, path) {
        Value::Null => None,
        Value::Bool(b) => Some(b),
        _ => None,
    }
}

/// 从嵌套的JSON结构中获取数组
pub fn get_array(json: &Value, path: &str) -> Option<Vec<Value>> {
    // get_path(json, path).and_then(|v| v.as_array().map(|a| a.clone()))
    match get_path(json, path) {
        Value::Null => None,
        Value::Array(a) => Some(a.clone()),
        _ => None,
    }
}

/// 从嵌套的JSON结构中获取对象
pub fn get_object(json: &Value, path: &str) -> Option<serde_json::Map<String, Value>> {
    // get_path(json, path).and_then(|v| v.as_object().map(|o| o.clone()))
    match get_path(json, path) {
        Value::Null => None,
        Value::Object(o) => Some(o.clone()),
        _ => None,
    }
}
