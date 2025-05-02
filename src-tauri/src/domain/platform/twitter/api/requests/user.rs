use super::super::core::param_builder::{Builder, ParamBuilder};
use super::super::enums::feature::Features;
use super::super::enums::field_toggles::FieldToggles;
use super::super::enums::variables::Variables;
use super::model::{Params, Payload};
use crate::keys;

use reqwest::Method;

pub fn likes(id: String, count: Option<u32>, cursor: Option<String>) -> Payload {
    let mut feature_builder = ParamBuilder::<Features>::new();
    let mut variable_builder = ParamBuilder::<Variables>::new();
    let mut field_toggles_builder = ParamBuilder::<FieldToggles>::new();

    feature_builder
        .enable(keys![
            Features::ProfileLabelImprovementsPcfLabelInPostEnabled,
            Features::RwebTipjarConsumptionEnabled,
            Features::VerifiedPhoneLabelEnabled,
            Features::CreatorSubscriptionsTweetPreviewApiEnabled,
            Features::ResponsiveWebGraphqlTimelineNavigationEnabled,
            Features::CommunitiesWebEnableTweetCommunityResultsFetch,
            Features::C9sTweetAnatomyModeratorBadgeEnabled,
            Features::ResponsiveWebGrokAnalyzePostFollowupsEnabled,
            Features::ResponsiveWebGrokShareAttachmentEnabled,
            Features::ArticlesPreviewEnabled,
            Features::ResponsiveWebEditTweetApiEnabled,
            Features::GraphqlIsTranslatableRwebTweetIsTranslatableEnabled,
            Features::ViewCountsEverywhereApiEnabled,
            Features::LongformNotetweetsConsumptionEnabled,
            Features::ResponsiveWebTwitterArticleTweetConsumptionEnabled,
            Features::FreedomOfSpeechNotReachFetchEnabled,
            Features::StandardizedNudgesMisinfo,
            Features::TweetWithVisibilityResultsPreferGqlLimitedActionsPolicyEnabled,
            Features::LongformNotetweetsRichTextReadEnabled,
            Features::LongformNotetweetsInlineMediaEnabled,
            Features::ResponsiveWebGrokImageAnnotationEnabled,
            Features::ResponsiveWebGrokAnalysisButtonFromBackend,
        ])
        .disable(keys![
            Features::RwebVideoScreenEnabled,
            Features::ResponsiveWebGraphqlSkipUserProfileImageExtensionsEnabled,
            Features::PremiumContentApiReadEnabled,
            Features::ResponsiveWebGrokAnalyzeButtonFetchTrendsEnabled,
            Features::ResponsiveWebJetfuelFrame,
            Features::TweetAwardsWebTippingEnabled,
            Features::ResponsiveWebGrokShowGrokTranslatedPost,
            Features::CreatorSubscriptionsQuoteTweetPreviewEnabled,
            Features::ResponsiveWebEnhanceCardsEnabled,
        ]);

    // 设置变量
    variable_builder
        .set("userId", id)
        .set("count", count.unwrap_or(5))
        .disable(keys![
            Variables::IncludePromotedContent,
            Variables::WithClientEventToken,
            Variables::WithBirdwatchNotes,
            Variables::WithVoice,
            Variables::WithV2timeline,
        ]);

    field_toggles_builder.disable(keys![FieldToggles::WithArticlePlainText]);

    // 如果提供了cursor，则添加到变量中
    if let Some(cursor_value) = cursor {
        variable_builder.set("cursor", cursor_value);
    }

    let params = Params {
        features: feature_builder.build(),
        variables: variable_builder.build(),
        field_toggles: Some(field_toggles_builder.build()),
    };

    Payload {
        method: Method::GET,
        url: "https://x.com/i/api/graphql/eQl7iWsCr2fChppuJdAeRw/Likes".to_string(),
        params,
    }
}
