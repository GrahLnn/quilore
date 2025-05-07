use serde_json::Value;
use std::collections::HashMap;
use std::marker::PhantomData;

pub trait Flag {
    fn as_str(&self) -> &'static str;
}

pub trait Builder<T: Flag> {
    fn set<K: Into<String>, V: Into<Value>>(&mut self, key: K, value: V) -> &mut Self;
    fn enable<U: IntoEnableItems<T>>(&mut self, items: U) -> &mut Self;
    fn disable<U: IntoEnableItems<T>>(&mut self, items: U) -> &mut Self;
    fn build(&self) -> String;
}

/// 构建器实现，基于 HashMap 存储布尔开关
pub struct ParamBuilder<T: Flag> {
    map: HashMap<String, Value>,
    _phantom: PhantomData<T>,
}

impl<T: Flag> ParamBuilder<T> {
    pub fn new() -> Self {
        Self {
            map: HashMap::new(),
            _phantom: PhantomData,
        }
    }
}

impl<T: Flag> Builder<T> for ParamBuilder<T> {
    fn set<K: Into<String>, V: Into<Value>>(&mut self, key: K, value: V) -> &mut Self {
        self.map.insert(key.into(), value.into());
        self
    }

    fn enable<U: IntoEnableItems<T>>(&mut self, items: U) -> &mut Self {
        for key in items.into_items() {
            self.map.insert(key.as_str().to_string(), Value::Bool(true));
        }
        self
    }

    fn disable<U: IntoEnableItems<T>>(&mut self, items: U) -> &mut Self {
        for key in items.into_items() {
            self.map
                .insert(key.as_str().to_string(), Value::Bool(false));
        }
        self
    }

    fn build(&self) -> String {
        serde_json::to_string(&self.map).expect("Failed to serialize map")
    }
}

/// 支持将单个/多个 flag 转换为 Vec 的 trait
pub trait IntoEnableItems<T> {
    fn into_items(self) -> Vec<T>;
}

impl<T> IntoEnableItems<T> for T {
    fn into_items(self) -> Vec<T> {
        vec![self]
    }
}

impl<T> IntoEnableItems<T> for Vec<T> {
    fn into_items(self) -> Vec<T> {
        self
    }
}

impl<'a, T: Clone> IntoEnableItems<T> for &'a [T] {
    fn into_items(self) -> Vec<T> {
        self.to_vec()
    }
}

/// 用于简化多个枚举传参
#[macro_export]
macro_rules! keys {
    ( $( $key:expr ),* $(,)? ) => {
        vec![ $( $key ),* ]
    };
}
