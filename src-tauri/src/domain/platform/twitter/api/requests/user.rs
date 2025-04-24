use super::super::core::param_builder::{Builder, ParamBuilder};
use super::super::enums::feature::Features;
use super::super::enums::variables::Variables;
use super::model::{Params, Payload};
use crate::keys;

use reqwest::Method;

pub fn likes(id: String, count: Option<u32>, cursor: Option<String>) -> Payload {
    let mut feature_builder = ParamBuilder::<Features>::new();
    let mut variable_builder = ParamBuilder::<Variables>::new();

    feature_builder
        .enable(keys![
            Features::RwebListsTimelineRedesignEnabled,
            Features::ResponsiveWebGraphqlExcludeDirectiveEnabled,
            Features::VerifiedPhoneLabelEnabled,
            Features::CreatorSubscriptionsTweetPreviewApiEnabled,
            Features::ResponsiveWebGraphqlTimelineNavigationEnabled,
            Features::TweetypieUnmentionOptimizationEnabled,
            Features::ResponsiveWebEditTweetApiEnabled,
            Features::GraphqlIsTranslatableRwebTweetIsTranslatableEnabled,
            Features::ViewCountsEverywhereApiEnabled,
            Features::LongformNotetweetsConsumptionEnabled,
            Features::FreedomOfSpeechNotReachFetchEnabled,
            Features::StandardizedNudgesMisinfo,
            Features::TweetWithVisibilityResultsPreferGqlLimitedActionsPolicyEnabled,
            Features::LongformNotetweetsRichTextReadEnabled,
            Features::LongformNotetweetsInlineMediaEnabled,
        ])
        .disable(keys![
            Features::ResponsiveWebGraphqlSkipUserProfileImageExtensionsEnabled,
            Features::ResponsiveWebTwitterArticleTweetConsumptionEnabled,
            Features::TweetAwardsWebTippingEnabled,
            Features::ResponsiveWebMediaDownloadVideoEnabled,
            Features::ResponsiveWebEnhanceCardsEnabled,
        ]);

    // 设置变量
    variable_builder
        .set("userId", id) // id已经在调用处理过了，这里不需要再处理
        .set("count", count.unwrap_or(100))
        .disable(keys![
            Variables::IncludePromotedContent,
            Variables::WithClientEventToken,
            Variables::WithBirdwatchNotes,
            Variables::WithVoice,
            Variables::WithV2timeline,
        ]);

    // 如果提供了cursor，则添加到变量中
    if let Some(cursor_value) = cursor {
        variable_builder.set("cursor", cursor_value);
    }

    let params = Params {
        features: feature_builder.build(),
        variables: variable_builder.build(),
    };

    Payload {
        method: Method::GET,
        url: "https://x.com/i/api/graphql/kgZtsNyE46T3JaEf2nF9vw/Likes".to_string(),
        params,
    }
}
