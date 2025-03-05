use serde::Deserializer;

pub fn i64_from_string_or_number<'de, D>(deserializer: D) -> Result<i64, D::Error>
where
    D: Deserializer<'de>,
{
    struct I64orStringVisitor;

    impl<'de> serde::de::Visitor<'de> for I64orStringVisitor {
        type Value = i64;

        fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
            formatter.write_str("a string or integer that can be parsed to i64")
        }

        // 如果是字符串，尝试解析成 i64
        fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            value
                .parse::<i64>()
                .map_err(|_| E::custom(format!("cannot parse `{}` as i64", value)))
        }

        // 如果本身是 i64，直接返回
        fn visit_i64<E>(self, value: i64) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            Ok(value)
        }

        // 如果是 u64，尝试转成 i64
        fn visit_u64<E>(self, value: u64) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            // 注意：如果实际值超过 i64::MAX，会出错
            if value <= i64::MAX as u64 {
                Ok(value as i64)
            } else {
                Err(E::custom(format!(
                    "number {} is out of range for i64",
                    value
                )))
            }
        }
    }

    // 让 Serde 用我们定义的 Visitor 去解析即可
    deserializer.deserialize_any(I64orStringVisitor)
}
