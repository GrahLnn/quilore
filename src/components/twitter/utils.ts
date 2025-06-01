import { Matchable } from "@/lib/matchable";
import type { Content, ContentToCopy, Media, Post } from "@/src/cmd/commands";
import { DataTag } from "@/src/utils/enums";

// 定义带有缩放属性的Media类型
export type ScaledMedia = Media & {
  scaledWidth?: number;
  scaledHeight?: number;
};

export enum TweetState {
  Post = "post",
  Quote = "quote",
  Reply = "reply",
}

export function isLandscape(m: Media) {
  return (m.width ?? 0) >= (m.height ?? 0);
}

// 全排列辅助
export function permutations(arr: number[]): number[][] {
  if (arr.length <= 1) return [arr];
  const result: number[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const first = arr[i];
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) result.push([first, ...perm]);
  }
  return result;
}

// 给四张图做等比缩放
export function scaleMediaList(mediaList: Media[]): ScaledMedia[] {
  if (!mediaList.length) return mediaList as ScaledMedia[];
  const minWidth = Math.min(...mediaList.map((m) => m.width ?? 1));
  if (minWidth <= 0) return mediaList as ScaledMedia[];
  return mediaList.map((m) => {
    if (!m.width || !m.height) return m as ScaledMedia;
    const ratio = minWidth / m.width;
    return { ...m, scaledWidth: minWidth, scaledHeight: m.height * ratio };
  });
}

export function calcLayout(mediaList: Media[]): Array<Array<number>> {
  const scaled = scaleMediaList(mediaList);

  // 使用 reduce 找到最大值和最小值的索引
  const maxIdx = scaled.reduce(
    (maxI, cur, i) =>
      (cur.scaledHeight ?? 0) > (scaled[maxI].scaledHeight ?? 0) ? i : maxI,
    0
  );
  const minIdx = scaled.reduce(
    (minI, cur, i) =>
      (cur.scaledHeight ?? 0) < (scaled[minI].scaledHeight ?? 0) ? i : minI,
    0
  );

  // 构造 others 数组（排除最大项）
  const others = scaled
    .map((m, i) => ({ idx: i, height: m.scaledHeight ?? 0 }))
    .filter((o) => o.idx !== maxIdx);

  return (scaled[maxIdx].scaledHeight ?? 0) -
    others[0].height -
    others[1].height >
    0
    ? [[maxIdx], others.map((o) => o.idx)]
    : maxIdx === minIdx
      ? [maxIdx, ...others.map((o) => o.idx)].reduce<[number[], number[]]>(
          ([a, b], v, i) => (i % 2 ? [a, [...b, v]] : [[...a, v], b]),
          [[], []]
        )
      : [
          [maxIdx, minIdx],
          others.filter((o) => o.idx !== minIdx).map((o) => o.idx),
        ];
}

export function buildContent(
  post: Post,
  lang: Matchable<"original" | "translated">
): ContentToCopy {
  const getText = (text: Content) =>
    text.translation && text.translation !== DataTag.NO_TRANSLATION
      ? text.translation
      : text.text;

  const getQuote = (translated: boolean) => {
    if (!post.quote) return null;
    return {
      author: post.quote.author.name,
      content: translated
        ? getText(post.quote.content)
        : post.quote.content.text,
      media: post.quote.media?.map((m) => m.description || "") || null,
    };
  };

  return lang.match({
    original: () => ({
      author: post.author.name,
      content: post.content.text,
      media: post.media?.map((m) => m.description || "") || null,
      quote: getQuote(false),
    }),
    translated: () => ({
      author: post.author.name,
      content: getText(post.content),
      media: post.media?.map((m) => m.description || "") || null,
      quote: getQuote(true),
    }),
  });
}
