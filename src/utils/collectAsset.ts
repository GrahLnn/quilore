import type {
  Asset,
  LikedPost,
  Media,
  Post,
  QuotePost,
  Conversation,
} from "@/src/cmd/commands"; // 按你的路径调整

/** 把媒体对象里包含的所有 Asset 都拉平为 asset.id 列表 */
function collectMediaAssets(media: Media | null): string[] {
  if (!media) return [];
  switch (media.type) {
    case "photo":
      return [media.asset.url];
    case "video":
      return [media.asset.url];
    case "animated_gif":
      return [media.asset.url];
    default:
      return [];
  }
}

/** 递归收集一个 Post 或 QuotePost 内的所有 asset.id */
export function collectPostAssets(post: Post | QuotePost): string[] {
  const ids: string[] = [];

  // 1) 作者头像
  ids.push(post.author.avatar.url);

  // 2) 本帖媒体
  if (post.media) ids.push(...post.media.flatMap((m) => collectMediaAssets(m)));

  // 3) 引用推文
  if ("quote" in post && post.quote) ids.push(...collectPostAssets(post.quote));

  // 4) 回复对话
  if ("replies" in post && post.replies) {
    post.replies.forEach((conv: Conversation) => {
      conv.conversation.forEach((reply) =>
        ids.push(...collectPostAssets(reply))
      );
    });
  }

  return ids;
}

/** 针对 LikedPost 列表，构建 assetId → sortidx 映射 */
export function buildAssetToSortidxMap(
  likedPosts: LikedPost[]
): Map<string, number> {
  const m = new Map<string, number>();
  likedPosts.forEach(({ sortidx, post }) => {
    collectPostAssets(post).forEach((aid) => m.set(aid, sortidx));
  });
  return m;
}
