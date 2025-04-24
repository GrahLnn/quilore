pub enum ELoginUrls {
    GuestToken,
    InitiateLogin,
    LoginSubtask,
}

impl ELoginUrls {
    pub fn as_str(&self) -> &'static str {
        match self {
            ELoginUrls::GuestToken => "https://api.twitter.com/1.1/guest/activate.json",
            ELoginUrls::InitiateLogin => {
                "https://api.twitter.com/1.1/onboarding/task.json?flow_name=login"
            }
            ELoginUrls::LoginSubtask => "https://api.twitter.com/1.1/onboarding/task.json",
        }
    }
}

pub enum Tokens {
    AuthToken,
}

impl Tokens {
    pub fn as_str(&self) -> &'static str {
        match self {
            Tokens::AuthToken => "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
        }
    }
}