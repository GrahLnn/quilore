import { cn } from "@/lib/utils";
import { crab } from "@/src/cmd/commandAdapter";
import type { LikedPost } from "@/src/cmd/commands";
import TweetCard from "@/src/components/twitter/post";
import { Masonry, useInfiniteLoader } from "masonic";
import { useEffect, useRef, useState } from "react";
import { scrollbar } from "../../components/scrollbar";
import { useScrollYRef } from "../../hooks/scroll";
import { icons } from "../../assets/icons";
import { station } from "../../subpub/buses";
import { events } from "@/src/cmd/commands";
import { open } from "@tauri-apps/plugin-dialog";

interface PostsProps {
  initialPosts?: LikedPost[];
  initialCursor?: number | null;
}

interface ActionButtonProps {
  className?: string | undefined | false;
  onClick?: () => void;
  icon?: React.ReactNode;
  content?: string;
}

function ActionButton({
  className,
  onClick,
  icon,
  content,
}: ActionButtonProps) {
  return (
    <div
      className={cn([
        "flex items-center justify-center gap-2",
        "bg-[#e7e7e7] hover:bg-[#d1d1d1] dark:bg-[#171717] dark:hover:bg-[#404040] rounded-md pl-4 pr-5 py-2",
        "hover:shadow-[var(--butty-shadow)]",
        "select-none cursor-pointer",
        "transition duration-300 ease-in-out",
        "text-[#212121] dark:text-[#d4d4d4]",
        // scanning && "opacity-0 pointer-events-none",
        className,
      ])}
      onClick={onClick}
    >
      {/* <icons.scan size={14} /> */}
      {icon}
      {/* <div className="text-xs">Scan your liked posts</div> */}
      <div className="text-xs">{content}</div>
    </div>
  );
}

export default function Posts({ initialCursor = null }: PostsProps) {
  const [sortedIdxList, setSortedIdxList] = useState<Array<{ id: number }>>([]);
  const postsMapRef = useRef(new Map());
  const [cursor, setCursor] = useState<number | null>(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const [canScan, setCanScan] = station.scanCheck.useAll();
  const setTitle = station.postsTitle.useSet();
  const setAssetState = station.assetState.useSet();
  // const isScrollFast = driveStation.isTooFast.useSee();

  // 使用自定义 scrollYRef hook，不会导致组件重绘
  useScrollYRef(); // 直接使用，内部已处理滚动条位置更新
  // useScrollVelocity();

  // 首次加载和容器高度更新
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
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
    const getCookie = async () => {
      const result = await crab.getUserkvValue("Twitter");
      result.tap((v) => {
        if (v) {
          setCanScan(true);
        }
      });
    };
    getCookie();

    const assetEvent = events.assetDownloadBatchEvent.listen((event) => {
      // const prev = getAssetState();
      const newMap = new Map();

      for (const item of event.payload.items) {
        newMap.set(item.aid ?? "0", item.available);
      }

      setAssetState(newMap);
    });

    const importEvent = events.importEvent.listen(() => {
      loadMorePosts();
    });

    const scanEvent = events.scanLikesEvent.listen((e) => {
      // [TODO] 当已经有列表的时候需要更新？
      if (e.payload.count <= 100) loadMorePosts();
    });

    return () => {
      if (observedNode) {
        resizeObserver.unobserve(observedNode);
      }
      resizeObserver.disconnect();
      assetEvent.then((f) => f());
      scanEvent.then((f) => f());
      importEvent.then((f) => f());
    };
  }, []);

  useEffect(() => {
    if (sortedIdxList.length === 0 && !isLoading) {
      setTitle("Welcome");
    } else {
      setTitle("X.Likes");
    }
  }, [isLoading, sortedIdxList.length]);

  // 加载更多
  const loadMorePosts = async () => {
    // if (isLoading || cursor == null || cursor === 0) return;
    setIsLoading(true);

    const result = await crab.takePostChunk(cursor);
    result.match({
      Ok: ({ data, cursor: newCursor }) => {
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
      },
      Err: (error) => {
        console.log("获取帖子失败:", error);
      },
    });
    setIsLoading(false);
  };

  const maybeLoadMore = useInfiniteLoader(
    async () => {
      await loadMorePosts(); // 你可以在这里做你的请求
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
      {sortedIdxList.length === 0 && isLoading && (
        <div className="flex justify-center items-center flex-col text-center gap-8 overflow-hidden flex-1 text-gray-500">
          Loading...
        </div>
      )}
      {sortedIdxList.length === 0 && !isLoading && (
        <div
          className={cn([
            "flex justify-center items-center flex-col text-center gap-4 flex-1",
            "select-none cursor-default",
          ])}
        >
          <div className="relative w-48 h-36 bg-gray-200/40 dark:bg-[#171717] rounded-md shadow-md p-3">
            <div className="absolute bottom-4 left-3">
              <div className="w-20 h-2 bg-gray-300/40 dark:bg-[#262626] rounded mb-2"></div>
              <div className="w-16 h-2 bg-gray-300/40 dark:bg-[#262626] rounded"></div>
            </div>
          </div>
          <div className="h-4" />
          <div className="font-semibold text-[#262626] dark:text-[#e5e5e5]">
            No posts yet!!
          </div>
          <div className="text-[#737373] dark:text-[#a3a3a3] text-sm">
            Begin with your first data acquisition
          </div>

          {canScan ? (
            <div
              className={cn([
                "flex items-center gap-2",
                scanning && "opacity-0 pointer-events-none",
              ])}
            >
              <ActionButton
                icon={<icons.scan />}
                content="Scan your liked posts"
                onClick={async () => {
                  crab.scanLikesTimeline();
                  setScanning(true);
                  setIsLoading(true);
                }}
              />
              <ActionButton
                icon={<icons.squareDashedDownload />}
                content="Import from file"
                onClick={() => {
                  open({
                    filters: [
                      {
                        name: "JSON",
                        extensions: ["json"],
                      },
                    ],
                  }).then((path) => {
                    if (!path) return;
                    crab.importData(path);
                    setScanning(true);
                    setIsLoading(true);
                  });
                }}
              />
            </div>
          ) : (
            <div className="text-xs text-[#e81123]">
              Cookie is missing. Please click the &quot;Welcome&quot; button at
              the top to add it.
            </div>
          )}
        </div>
      )}
      {/* <Masonry
        items={sortedIdxList}
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
      /> */}
    </div>
  );
}
