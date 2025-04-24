use anyhow::Result;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EAuthentication {
    Guest,
    User,
}

impl EAuthentication {
    pub fn as_str(&self) -> &'static str {
        match self {
            EAuthentication::Guest => "guest",
            EAuthentication::User => "user",
        }
    }
    // pub fn from_str(s: &str) -> Result<Self> {
    //     match s {
    //         "guest" => Authentication::Guest,
    //         "user" => Authentication::User,
    //         "login" => Authentication::Login,
    //         _ => Err(anyhow::anyhow!("Invalid authentication type")),
    //     }
    // }
}
