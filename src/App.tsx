import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { Toaster } from "@/components/ui/sonner";
import { Masonry } from "masonic";
import { cmdAdapter } from "./cmd/commandAdapter";
import type { LikedPost } from "./cmd/commands";
import TweetCard from "./conponents/twitter/postCard";
import TopBar from "./topbar";
import { Lightbox } from "./conponents/lightbox/lightbox";

interface PostsProps {
  initialPosts?: LikedPost[];
  initialCursor?: number | null;
}

function Posts({ initialPosts = [], initialCursor = null }: PostsProps) {
  const [posts, setPosts] = useState<LikedPost[]>(initialPosts);
  const [cursor, setCursor] = useState<number | null>(initialCursor);
  const [isLoading, setIsLoading] = useState(false);

  // 首次加载
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (posts.length === 0) {
      loadMorePosts();
    }
  }, []);

  // 加载更多
  const loadMorePosts = useCallback(async () => {
    if (isLoading) return; // 避免重复请求
    if (cursor === 0) return; // 如果后端返回cursor=0表示没下一页，可据此终止请求

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
      },
    });
    setIsLoading(false);
  }, [isLoading, cursor]);

  useEffect(() => {
    console.log("len posts", posts.length);
  }, [posts]);

  return (
    <Masonry
      items={posts}
      columnGutter={16}
      columnWidth={340}
      render={({ data }) => <TweetCard postdata={data.post} />}
      onRender={(_startIndex, stopIndex, items) => {
        if (!isLoading && stopIndex >= items.length - 30) {
          loadMorePosts();
        }
      }}
    />
  );
}

function App() {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden hide-scrollbar">
      <TopBar />
      <main className="flex-1 overflow-hidden mt-8 hide-scrollbar">
        <div className="flex justify-center items-center flex-col text-center gap-4 py-4 max-w-[1186px] mx-auto h-full">
          <Posts />
        </div>
      </main>
      <Toaster />
      <Lightbox />
    </div>
  );
}

export default App;
