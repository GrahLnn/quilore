use serde_json::Value;

/// 在JSON对象中查找具有特定字段和值的对象
pub fn find_by_filter(data: &Value, field: &str, value: &str) -> Vec<Value> {
    let mut results = Vec::new();
    
    if let Some(obj) = data.as_object() {
        // 检查当前对象是否匹配
        if let Some(field_value) = obj.get(field) {
            if let Some(field_str) = field_value.as_str() {
                if field_str == value {
                    results.push(data.clone());
                }
            }
        }
        
        // 递归检查所有子对象
        for (_, val) in obj {
            if val.is_object() {
                results.extend(find_by_filter(val, field, value));
            } else if val.is_array() {
                if let Some(arr) = val.as_array() {
                    for item in arr {
                        if item.is_object() {
                            results.extend(find_by_filter(item, field, value));
                        }
                    }
                }
            }
        }
    } else if let Some(arr) = data.as_array() {
        // 如果是数组，递归检查所有元素
        for item in arr {
            results.extend(find_by_filter(item, field, value));
        }
    }
    
    results
}
