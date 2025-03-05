use anyhow::Result;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MetaKey {
    FirstCursor,
}

impl MetaKey {
    pub fn as_str(self) -> &'static str {
        match self {
            MetaKey::FirstCursor => "first_cursor",
        }
    }

    pub fn from_str(s: &str) -> Result<Self, String> {
        match s {
            "first_cursor" => Ok(MetaKey::FirstCursor),
            _ => Err(format!("Unknown MetaKey: {}", s)),
        }
    }
}

impl std::str::FromStr for MetaKey {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        MetaKey::from_str(s)
    }
}
