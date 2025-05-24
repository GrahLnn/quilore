use crate::domain::platform::Task;

use super::asset::DbAsset;
use super::like::DbLikedPost;
use super::media::DbMedia;
use super::post::{DbPost, DbReply};
use super::users::DbUser;

#[derive(Debug, Clone)]
pub struct DbEntitie {
    pub like: Vec<DbLikedPost>,
    pub posts: Vec<DbPost>,
    pub medias: Vec<DbMedia>,
    pub users: Vec<DbUser>,
    pub assets: Vec<DbAsset>,
    pub replies: Vec<DbReply>,
    pub tasks: Vec<Task>,
}

impl DbEntitie {
    pub fn default() -> Self {
        Self {
            like: Vec::new(),
            posts: Vec::new(),
            medias: Vec::new(),
            users: Vec::new(),
            assets: Vec::new(),
            replies: Vec::new(),
            tasks: Vec::new(),
        }
    }
    /// 将多个 DbEntitie 合并成一个
    pub fn merge_all(list: Vec<DbEntitie>) -> DbEntitie {
        let mut new = DbEntitie::default();
        for e in list {
            new.like.extend(e.like);
            new.posts.extend(e.posts);
            new.medias.extend(e.medias);
            new.users.extend(e.users);
            new.assets.extend(e.assets);
            new.replies.extend(e.replies);
            new.tasks.extend(e.tasks);
        }
        new
    }
}
