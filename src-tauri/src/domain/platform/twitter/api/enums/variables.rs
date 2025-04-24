use super::super::core::param_builder::Flag;

pub enum Variables {
    IncludePromotedContent,
    WithClientEventToken,
    WithBirdwatchNotes,
    WithVoice,
    WithV2timeline,
    FocalTweetId,
    Referrer,
    WithRuxInjections,
    WithCommunity,
    WithQuickPromoteEligibilityTweetFields,
}

impl Flag for Variables {
    fn as_str(&self) -> &'static str {
        match self {
            Variables::IncludePromotedContent => "includePromotedContent",
            Variables::WithClientEventToken => "withClientEventToken",
            Variables::WithBirdwatchNotes => "withBirdwatchNotes",
            Variables::WithVoice => "withVoice",
            Variables::WithV2timeline => "withV2Timeline",
            Variables::FocalTweetId => "focalTweetId",
            Variables::Referrer => "referrer",
            Variables::WithRuxInjections => "with_rux_injections",
            Variables::WithCommunity => "withCommunity",
            Variables::WithQuickPromoteEligibilityTweetFields => {
                "withQuickPromoteEligibilityTweetFields"
            }
        }
    }
}
