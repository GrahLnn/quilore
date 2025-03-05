import type { Media } from "@/src/cmd/commands";

export enum TweetState {
  Post = "post",
  Quote = "quote",
  Reply = "reply",
}

export function isLandscape(m: Media) {
  return (m.width ?? 0) > (m.height ?? 0);
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
export function scaleMediaList(mediaList: Media[]) {
  if (!mediaList.length) return mediaList;
  const minWidth = Math.min(...mediaList.map((m) => m.width ?? 1));
  if (minWidth <= 0) return mediaList;
  return mediaList.map((m) => {
    if (!m.width || !m.height) return m;
    const ratio = minWidth / m.width;
    return { ...m, scaledWidth: minWidth, scaledHeight: m.height * ratio };
  });
}

// 计算四图布局的两行总高度
export function calcTotalHeight(scaledList: Media[], order: number[]) {
  const row1 = Math.max(
    scaledList[order[0]].height ?? 0,
    scaledList[order[1]].height ?? 0
  );
  const row2 = Math.max(
    scaledList[order[2]].height ?? 0,
    scaledList[order[3]].height ?? 0
  );
  return row1 + row2;
}

export function getMediaTotalHeight(
  media?: Array<Media> | null | undefined
): number {
  if (!media || media.length === 0) return 0;
  const count = media.length;
  const CONTAINER_WIDTH = 364.67;
  // 1. 单张媒体，全宽显示
  if (count === 1) {
    const m = media[0];
    const scale = CONTAINER_WIDTH / (m.width || CONTAINER_WIDTH);
    return (m.height || 0) * scale;
  }

  // 2. 两张媒体
  if (count === 2) {
    // const bothLandscape = isLandscape(media[0]) && isLandscape(media[1]);
    const bothPortrait = !isLandscape(media[0]) && !isLandscape(media[1]);
    if (bothPortrait) {
      // 横排布局：采用 grid 限制最小宽度，单个媒体宽度为 (CONTAINER_WIDTH )/2
      const cellWidth = CONTAINER_WIDTH / 2;
      const h1 =
        (media[0].height || 0) * (cellWidth / (media[0].width || cellWidth));
      const h2 =
        (media[1].height || 0) * (cellWidth / (media[1].width || cellWidth));
      return Math.max(h1, h2);
    }
    // 横图或混合：竖排，每张全宽，累加高度并加上间隙
    const h1 =
      (media[0].height || 0) *
      (CONTAINER_WIDTH / (media[0].width || CONTAINER_WIDTH));
    const h2 =
      (media[1].height || 0) *
      (CONTAINER_WIDTH / (media[1].width || CONTAINER_WIDTH));
    return h1 + h2;
  }

  // 3. 三张媒体
  if (count === 3) {
    const wideCount = media.filter((m) => isLandscape(m)).length;
    const tallCount = count - wideCount;
    if (wideCount === 3) {
      // 全为横图：竖排，每张全宽，累加高度加上间隙
      let total = 0;
      for (const m of media) {
        total +=
          (m.height || 0) * (CONTAINER_WIDTH / (m.width || CONTAINER_WIDTH));
      }
      return total * (count - 1);
    }
    if (tallCount === 3) {
      // 全为竖图：横排布局，考虑2列：第一行放2张，第二行放1张（全宽）
      const cellWidth = CONTAINER_WIDTH / 2;
      const h1 =
        (media[0].height || 0) * (cellWidth / (media[0].width || cellWidth));
      const h2 =
        (media[1].height || 0) * (cellWidth / (media[1].width || cellWidth));
      const row1 = Math.max(h1, h2);
      const h3 =
        (media[2].height || 0) *
        (CONTAINER_WIDTH / (media[2].width || CONTAINER_WIDTH));
      return row1 + h3;
    }
    if (wideCount === 2 && tallCount === 1) {
      // 两张横图、一张竖图：采用两列布局，左侧两横图竖排，右侧单独竖图
      const colWidth = CONTAINER_WIDTH / 2;
      const wideImages = media.filter((m) => isLandscape(m));
      const tallImage = media.find((m) => !isLandscape(m));
      if (!tallImage || wideImages.length < 2) return 0;
      const leftHeight =
        (wideImages[0].height || 0) *
          (colWidth / (wideImages[0].width || colWidth)) +
        (wideImages[1].height || 0) *
          (colWidth / (wideImages[1].width || colWidth));
      const rightHeight =
        (tallImage.height || 0) * (colWidth / (tallImage.width || colWidth));
      return Math.max(leftHeight, rightHeight);
    }
    if (wideCount === 1 && tallCount === 2) {
      // 一张横图、两张竖图：横图全宽在上，下方采用两列布局展示竖图
      const wideImage = media.find((m) => isLandscape(m));
      const otherImages = media.filter((m) => !isLandscape(m));
      if (!wideImage || otherImages.length < 2) return 0;
      const topHeight =
        (wideImage.height || 0) *
        (CONTAINER_WIDTH / (wideImage.width || CONTAINER_WIDTH));
      const cellWidth = CONTAINER_WIDTH / 2;
      const h1 =
        (otherImages[0].height || 0) *
        (cellWidth / (otherImages[0].width || cellWidth));
      const h2 =
        (otherImages[1].height || 0) *
        (cellWidth / (otherImages[1].width || cellWidth));
      const bottomHeight = Math.max(h1, h2);
      return topHeight + bottomHeight;
    }
  }

  // 4. 四张媒体：采用2×2的网格布局，每个单元格宽度为 (CONTAINER_WIDTH )/2，
  // 尝试所有排列计算最小总高度：行高度取同一行两张中较高者，总高度 = row1 +  row2
  if (count === 4) {
    const cellWidth = CONTAINER_WIDTH / 2;
    const idxArr = [0, 1, 2, 3];
    const perms = permutations(idxArr);
    let minTotal = Number.POSITIVE_INFINITY;
    for (const order of perms) {
      const h1 =
        (media[order[0]].height || 0) *
        (cellWidth / (media[order[0]].width || cellWidth));
      const h2 =
        (media[order[1]].height || 0) *
        (cellWidth / (media[order[1]].width || cellWidth));
      const row1 = Math.max(h1, h2);
      const h3 =
        (media[order[2]].height || 0) *
        (cellWidth / (media[order[2]].width || cellWidth));
      const h4 =
        (media[order[3]].height || 0) *
        (cellWidth / (media[order[3]].width || cellWidth));
      const row2 = Math.max(h3, h4);
      const total = row1 + row2;
      if (total < minTotal) {
        minTotal = total;
      }
    }
    return minTotal;
  }

  return 0;
}
