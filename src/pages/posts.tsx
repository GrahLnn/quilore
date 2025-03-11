import { cn } from "@/lib/utils";
import { cmdAdapter } from "@/src/cmd/commandAdapter";
import type { LikedPost } from "@/src/cmd/commands";
import TweetCard from "@/src/components/twitter/postCard";
import { Masonry } from "masonic";
import { useCallback, useEffect, useRef, useState } from "react";
import { scrollbar } from "../components/scrollbar";
import { useScrollYRef } from "../hooks/scroll";

interface PostsProps {
  initialPosts?: LikedPost[];
  initialCursor?: number | null;
}

export default function Posts({
  initialPosts = [],
  initialCursor = null,
}: PostsProps) {
  const [posts, setPosts] = useState<LikedPost[]>(initialPosts);
  const [cursor, setCursor] = useState<number | null>(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  // 使用自定义 scrollYRef hook，不会导致组件重绘
  useScrollYRef(); // 直接使用，内部已处理滚动条位置更新

  // 首次加载和容器高度更新
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (posts.length === 0) {
      loadMorePosts();
    }
    // 更新容器高度
    scrollbar.updateContainerHeight(container.current?.clientHeight || 0);

    // 监听容器大小变化，更新滚动条高度
    const resizeObserver = new ResizeObserver(() => {
      scrollbar.updateContainerHeight(container.current?.clientHeight || 0);
    });

    if (container.current) {
      resizeObserver.observe(container.current);
    }

    return () => {
      if (container.current) {
        resizeObserver.unobserve(container.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  // 加载更多
  const loadMorePosts = useCallback(async () => {
    if (isLoading) return; // 避免重复请求
    if (cursor === 0) return; // 后端返回cursor=0表示没下一页，终止请求
    setIsLoading(true);
    const result = await cmdAdapter.takePostChunk(cursor);
    result.match({
      ok: (data) => {
        const sortedData = data.data.sort(
          (a, b) => Number(b.sortidx) - Number(a.sortidx)
        );
        setPosts((prev) => [...prev, ...sortedData]);
        // 更新下一个 cursor
        const nextCursor = Number(data.cursor);
        setCursor(nextCursor);
      },
      err: (error) => {
        console.error("获取帖子失败:", error);
        setPosts([]);
      },
    });
    setIsLoading(false);
  }, [isLoading, cursor]);

  return (
    <div
      ref={container}
      className={cn([
        "flex justify-center items-center flex-col text-center gap-4 py-4",
        "max-w-[1186px] mx-auto h-full",
      ])}
    >
      {posts.length > 0 ? (
        <Masonry
          items={posts}
          overscanBy={6}
          columnGutter={16}
          columnWidth={340}
          maxColumnCount={3}
          render={({ data }) => <TweetCard postdata={data.post} />}
          onRender={(_startIndex, stopIndex, items) => {
            // 当渲染接近末尾时，加载更多数据
            if (!isLoading && stopIndex >= items.length - 30) {
              loadMorePosts();
            }
          }}
        />
      ) : (
        <div className="text-gray-500">No posts found</div>
      )}
    </div>
  );
}
