use super::super::core::param_builder::Flag;

pub enum Features {
    RwebListsTimelineRedesignEnabled,
    ResponsiveWebGraphqlExcludeDirectiveEnabled,
    VerifiedPhoneLabelEnabled,
    CreatorSubscriptionsTweetPreviewApiEnabled,
    ResponsiveWebGraphqlTimelineNavigationEnabled,
    ResponsiveWebGraphqlSkipUserProfileImageExtensionsEnabled,
    TweetypieUnmentionOptimizationEnabled,
    ResponsiveWebEditTweetApiEnabled,
    GraphqlIsTranslatableRwebTweetIsTranslatableEnabled,
    ViewCountsEverywhereApiEnabled,
    LongformNotetweetsConsumptionEnabled,
    ResponsiveWebTwitterArticleTweetConsumptionEnabled,
    TweetAwardsWebTippingEnabled,
    FreedomOfSpeechNotReachFetchEnabled,
    StandardizedNudgesMisinfo,
    TweetWithVisibilityResultsPreferGqlLimitedActionsPolicyEnabled,
    LongformNotetweetsRichTextReadEnabled,
    LongformNotetweetsInlineMediaEnabled,
    ResponsiveWebMediaDownloadVideoEnabled,
    ResponsiveWebEnhanceCardsEnabled,
}

impl Flag for Features {
    fn as_str(&self) -> &'static str {
        match self {
            Features::RwebListsTimelineRedesignEnabled => "rweb_lists_timeline_redesign_enabled",
            Features::ResponsiveWebGraphqlExcludeDirectiveEnabled => "responsive_web_graphql_exclude_directive_enabled",
            Features::VerifiedPhoneLabelEnabled => "verified_phone_label_enabled",
            Features::CreatorSubscriptionsTweetPreviewApiEnabled => "creator_subscriptions_tweet_preview_api_enabled",
            Features::ResponsiveWebGraphqlTimelineNavigationEnabled => "responsive_web_graphql_timeline_navigation_enabled",
            Features::ResponsiveWebGraphqlSkipUserProfileImageExtensionsEnabled => "responsive_web_graphql_skip_user_profile_image_extensions_enabled",
            Features::TweetypieUnmentionOptimizationEnabled => "tweetypie_unmention_optimization_enabled",
            Features::ResponsiveWebEditTweetApiEnabled => "responsive_web_edit_tweet_api_enabled",
            Features::GraphqlIsTranslatableRwebTweetIsTranslatableEnabled => "graphql_is_translatable_rweb_tweet_is_translatable_enabled",
            Features::ViewCountsEverywhereApiEnabled => "view_counts_everywhere_api_enabled",
            Features::LongformNotetweetsConsumptionEnabled => "longform_notetweets_consumption_enabled",
            Features::ResponsiveWebTwitterArticleTweetConsumptionEnabled => "responsive_web_twitter_article_tweet_consumption_enabled",
            Features::TweetAwardsWebTippingEnabled => "tweet_awards_web_tipping_enabled",
            Features::FreedomOfSpeechNotReachFetchEnabled => "freedom_of_speech_not_reach_fetch_enabled",
            Features::StandardizedNudgesMisinfo => "standardized_nudges_misinfo",
            Features::TweetWithVisibilityResultsPreferGqlLimitedActionsPolicyEnabled => "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled",
            Features::LongformNotetweetsRichTextReadEnabled => "longform_notetweets_rich_text_read_enabled",
            Features::LongformNotetweetsInlineMediaEnabled => "longform_notetweets_inline_media_enabled",
            Features::ResponsiveWebMediaDownloadVideoEnabled => "responsive_web_media_download_video_enabled",
            Features::ResponsiveWebEnhanceCardsEnabled => "responsive_web_enhance_cards_enabled",
        }
    }
}