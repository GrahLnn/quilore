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
  initialCursor?: number | null;
  canScan?: boolean;
}

export default function Posts({ initialCursor = null }: PostsProps) {
  const [sortedIdxList, setSortedIdxList] = postsStation.sortedIdxList.useAll();
  const postsMapRef = useRef(new Map());
  const [cursor, setCursor] = useState<number | null>(initialCursor);
  const container = useRef<HTMLDivElement>(null);
  const setTitle = station.postsTitle.useSet();
  const setAssetState = station.assetState.useSet();
  const catPage = station.catPage.useSee();

  useScrollYRef(); // 直接使用，内部已处理滚动条位置更新

  // 首次加载和容器高度更新
  useEffect(() => {
    setTitle("X.Likes");
    if (sortedIdxList.length === 0) {
      loadMorePosts();
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
        const sortedData = data.sort((a, b) => b.sortidx - a.sortidx);
        sortedData.forEach(({ sortidx, post }) => {
          postsMapRef.current.set(sortidx, post);
        });

        setSortedIdxList((prev) => {
          const existing = new Set(prev.map((v) => v.id));
          const newIdxs = sortedData
            .map(({ sortidx }) => ({ id: sortidx }))
            .filter((idx) => !existing.has(idx.id));

          return [...prev, ...newIdxs];
        });
        if (sortedData.length) {
          setCursor(newCursor);
        }
      });
    } else {
      const result = await crab.selectCollection(catPage);
      result.tap((c) => {
        c.items.forEach((post) => {
          postsMapRef.current.set(post.rest_id, post);
        });
        setSortedIdxList(c.items.map((post) => ({ id: post.rest_id })));
      });
    }
  };

  const maybeLoadMore = useInfiniteLoader(
    async () => {
      if (catPage) return;
      await loadMorePosts();
    },
    {
      isItemLoaded: (index, items) => !!items[index],
      threshold: 30,
    }
  );

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
          return post ? <TweetCard postdata={post} /> : null;
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
