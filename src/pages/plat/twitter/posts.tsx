import { cn } from "@/lib/utils";
import { crab } from "@/src/cmd/commandAdapter";
import type { LikedPost } from "@/src/cmd/commands";
import TweetCard from "@/src/components/twitter/post";
import { Masonry, useInfiniteLoader } from "masonic";
import { useEffect, useRef, useState } from "react";
import { scrollbar } from "../../../components/scrollbar";
import { useScrollYRef } from "../../../hooks/scroll";
import { station } from "../../../subpub/buses";
import { events } from "@/src/cmd/commands";
import { postsStation } from "./pages";

interface PostsProps {
  initialPosts?: LikedPost[];
  initialCursor?: string | null;
  canScan?: boolean;
}

export default function Posts({ initialCursor = null }: PostsProps) {
  const [sortedIdxList, setSortedIdxList] = postsStation.sortedIdxList.useAll();
  const postsMapRef = useRef(new Map());
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const container = useRef<HTMLDivElement>(null);
  const setTitle = station.postsTitle.useSet();
  const setAssetState = station.assetState.useSet();
  const setCurPosition = station.curPosition.useSet();
  const setInitCursor = station.initCursor.useSet();
  const catPage = station.catPage.useSee();

  const minIdxRef = useRef<number | null>(null);
  const maxIdxRef = useRef<number | null>(null);
  const pendingRef = useRef(false);

  useScrollYRef(); // 直接使用，内部已处理滚动条位置更新

  // 首次加载和容器高度更新
  useEffect(() => {
    setTitle(catPage || "X.Likes");
    if (sortedIdxList.length === 0) {
      loadMorePosts();
      setInitCursor(null);
    }
    // 更新容器高度
    scrollbar.updateContainerHeight(container.current?.clientHeight || 0);

    // 监听容器大小变化，更新滚动条高度
    const resizeObserver = new ResizeObserver(() => {
      scrollbar.updateContainerHeight(container.current?.clientHeight || 0);
    });

    let observedNode: HTMLDivElement | null = null;
    if (container.current) {
      resizeObserver.observe(container.current);
      observedNode = container.current;
    }

    const assetEvent = events.assetDownloadBatchEvent.listen((event) => {
      const newMap = new Map();

      for (const item of event.payload.items) {
        newMap.set(item.aid ?? "0", item.available);
      }

      setAssetState(newMap);
    });

    return () => {
      if (observedNode) {
        resizeObserver.unobserve(observedNode);
      }
      resizeObserver.disconnect();
      assetEvent.then((f) => f());
    };
  }, []);

  const loadMorePosts = async () => {
    if (!catPage) {
      const result = await crab.takePostChunk(cursor);
      result.tap(({ data, cursor: newCursor }) => {
        // const sortedData = data.sort((a, b) => b.sortidx - a.sortidx);
        data.forEach(({ post, sortidx }) => {
          postsMapRef.current.set(sortidx.toString(), post);
        });

        setSortedIdxList((prev) => {
          const existing = new Set(prev.map((v) => v.id));
          const newIdxs = data
            .map(({ sortidx }) => ({ id: sortidx.toString() }))
            .filter((idx) => !existing.has(idx.id));

          return [...prev, ...newIdxs];
        });
        if (data.length) {
          setCursor(newCursor);
        }
      });
    } else {
      const r = await crab.selectCollectionPagin(catPage, cursor);
      r.tap(({ data, cursor: newCursor }) => {
        data.forEach((post) => {
          postsMapRef.current.set(post.rest_id, post);
        });
        setSortedIdxList((prev) => {
          const existing = new Set(prev.map((v) => v.id));
          const newIdxs = data
            .map((post) => ({ id: post.rest_id }))
            .filter((idx) => !existing.has(idx.id));
          return [...prev, ...newIdxs];
        });
        if (data.length) {
          setCursor(newCursor);
        }
      });
    }
  };

  const isItemLoaded = (index: number, items: any) => {
    // 本轮（本帧）min/max 都动态收集
    if (minIdxRef.current === null) {
      minIdxRef.current = index;
    }
    if (maxIdxRef.current === null || index > maxIdxRef.current) {
      maxIdxRef.current = index;
    }
    // 本帧只处理一次
    if (!pendingRef.current) {
      pendingRef.current = true;
      window.requestAnimationFrame(() => {
        // 打印/上报一次本批次结果
        if (minIdxRef.current !== null && maxIdxRef.current !== null)
          setCurPosition(items[minIdxRef.current].id);

        // 每帧重置，等待下一批
        minIdxRef.current = null;
        maxIdxRef.current = null;
        pendingRef.current = false;
      });
    }
    return !!items[index];
  };

  const maybeLoadMore = useInfiniteLoader(loadMorePosts, {
    isItemLoaded,
    threshold: 30,
  });

  function handleCollect(
    postId: string | number,
    collected: boolean,
    collectAt: string
  ) {
    const post = postsMapRef.current.get(postId);
    if (post) {
      if (collected) post.collect_at = [...post.collect_at, collectAt];
      else
        post.collect_at = post.collect_at.filter(
          (x: string) => x !== collectAt
        );
    }
  }

  return (
    <div
      ref={container}
      className={cn([
        "flex justify-center items-center flex-col text-center gap-4 py-4",
        "w-[1186px] mx-auto h-full",
      ])}
    >
      <Masonry
        items={sortedIdxList}
        className="focus:outline-none"
        itemKey={({ id }) => id}
        overscanBy={6}
        columnGutter={16}
        columnWidth={340}
        maxColumnCount={3}
        render={({ data }) => {
          const post = postsMapRef.current.get(data.id);
          return post ? (
            <TweetCard
              postdata={post}
              onCollect={(collected, collectAt) =>
                handleCollect(data.id, collected, collectAt)
              }
            />
          ) : null;
        }}
        onRender={maybeLoadMore}
      />
      {sortedIdxList.length === 0 && catPage && (
        <div className="flex justify-center items-center flex-col text-center gap-8 overflow-hidden flex-1 text-gray-500">
          No posts in this collection
        </div>
      )}
    </div>
  );
}
