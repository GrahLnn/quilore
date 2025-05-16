use super::{
    asset::DbAsset,
    like::DbLikedPost,
    media::DbMedia,
    post::{DbPost, DbReply},
    users::DbUser,
};
use crate::{database::Crud, domain::platform::job::Job, domain::platform::task::Task};

pub async fn clean_database() -> anyhow::Result<()> {
    DbUser::clean().await?;
    DbLikedPost::clean().await?;
    DbPost::clean().await?;
    DbReply::clean().await?;
    DbMedia::clean().await?;
    DbAsset::clean().await?;
    Job::clean().await?;
    Task::clean().await?;
    Ok(())
}
