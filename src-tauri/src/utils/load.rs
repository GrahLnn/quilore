use crate::domain::enums::meta::MetaKey;
use crate::domain::models::meta::{DbMeta, Meta, MetaValue};
use crate::domain::models::twitter::post::DbReply;
use crate::domain::models::twitter::{
    like::{DbLikedPost, LikedPost},
    media::DbMedia,
    post::{DbPost, Post, PostType},
    users::DbUser,
};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::{fs::File, io::BufReader};

#[derive(Debug, Serialize, Deserialize)]
struct TweetMetaData {
    item: String,
    created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct TweetData {
    metadata: TweetMetaData,
    results: Vec<LikedPost>,
}

fn collect_nested_posts(post: &Post) -> (Vec<Post>, Vec<Post>, Vec<Post>) {
    let main_posts = vec![post.clone()];
    let mut quote_posts = Vec::new();
    let mut reply_posts = Vec::new();

    // 如果有引用的推文，递归处理，把引用的内容视为引用帖
    if let Some(ref quoted) = post.quote {
        quote_posts.push(Post::from_quote(quoted.clone()));
    }

    // 收集回复里的quote到单独的vec，因为要比对保留main中的，避免重复时保留成非main的了
    if let Some(ref conversations) = post.replies {
        for conv in conversations {
            for child_post in &conv.conversation {
                let (child_main, child_quotes, child_replies) = collect_nested_posts(child_post);
                // 这里认为回复里的主帖也是回复内容
                reply_posts.extend(child_main);
                quote_posts.extend(child_quotes);
                reply_posts.extend(child_replies);
            }
        }
    }

    (main_posts, quote_posts, reply_posts)
}

pub async fn load_data(
    file: &str,
) -> Result<(
    Vec<DbPost>,
    Vec<DbReply>,
    Vec<DbMedia>,
    Vec<DbUser>,
    Vec<DbLikedPost>,
    Vec<DbMeta>,
)> {
    let data = read_tweets_from_json(file)?;
    let favs = data.results;

    let mut posts = Vec::new();
    let mut replies = Vec::new();
    let mut quotes = Vec::new();
    let mut metadatas = Vec::new();
    let mut dbposts_map = HashMap::new();
    let mut dbreplies_map = HashMap::new();
    let mut dbusers_map = HashMap::new();
    let mut dbmedias_map = HashMap::new();

    for fav in favs.iter() {
        let (main_posts, quote_posts, reply_posts) = collect_nested_posts(&fav.post);
        posts.extend(main_posts);
        quotes.extend(quote_posts);

        replies.extend(reply_posts);
    }
    for post in posts {
        let dbpost = DbPost::from_domain(post.clone(), PostType::Post)?;
        dbposts_map.entry(dbpost.id.clone()).or_insert(dbpost);

        if let Some(medias) = post.media {
            for media in medias {
                let dbmedia = DbMedia::from_domain(media)?;
                dbmedias_map.entry(dbmedia.id.clone()).or_insert(dbmedia);
            }
        }

        let dbdatauser = DbUser::from_domain(post.author);
        dbusers_map
            .entry(dbdatauser.id.clone())
            .or_insert(dbdatauser);
    }

    for post in quotes {
        let dbpost = DbPost::from_domain(post.clone(), PostType::Post)?;
        dbposts_map.entry(dbpost.id.clone()).or_insert(dbpost);

        if let Some(medias) = post.media {
            for media in medias {
                let dbmedia = DbMedia::from_domain(media)?;
                dbmedias_map.entry(dbmedia.id.clone()).or_insert(dbmedia);
            }
        }

        let dbdatauser = DbUser::from_domain(post.author);
        dbusers_map
            .entry(dbdatauser.id.clone())
            .or_insert(dbdatauser);
    }
    for reply in replies {
        let dbpost = DbPost::from_domain(reply.clone(), PostType::Reply)?;
        let dbreply = DbReply(dbpost);
        dbreplies_map.insert(dbreply.0.id.clone(), dbreply);

        if let Some(medias) = reply.media {
            for media in medias {
                let dbmedia = DbMedia::from_domain(media)?;
                dbmedias_map.insert(dbmedia.id.clone(), dbmedia);
            }
        }

        let dbdatauser = DbUser::from_domain(reply.author);
        dbusers_map.insert(dbdatauser.id.clone(), dbdatauser);
    }

    // 收集所有的 DbLikedPost 实例
    let dbfavs: Result<Vec<DbLikedPost>> = favs
        .iter()
        .map(|fav| DbLikedPost::from_domain(fav.clone()))
        .collect();
    let dbfavs = dbfavs?;

    let dbposts: Vec<DbPost> = dbposts_map.into_values().collect();
    let dbreplies: Vec<DbReply> = dbreplies_map.into_values().collect();
    let dbmedias: Vec<DbMedia> = dbmedias_map.into_values().collect();
    let dbusers: Vec<DbUser> = dbusers_map.into_values().collect();

    let first_cursor = favs.iter().map(|fav| fav.sortidx).max().unwrap();

    metadatas.push(Meta {
        id: MetaKey::FirstCursor,
        v: MetaValue::Number(first_cursor.into()),
    });

    let db_metadatas: Result<Vec<DbMeta>, _> = metadatas
        .iter()
        .map(|m| DbMeta::from_domain(m.clone()))
        .collect();
    let db_metadatas = db_metadatas?;

    Ok((dbposts, dbreplies, dbmedias, dbusers, dbfavs, db_metadatas))
}

fn read_tweets_from_json(file_path: &str) -> Result<TweetData> {
    // 打开文件
    let file = File::open(file_path)?;
    let reader = BufReader::new(file);

    // 解析JSON
    let tweets: TweetData = serde_json::from_reader(reader)?;
    Ok(tweets)
}
