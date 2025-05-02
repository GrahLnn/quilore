import { cn } from "@/lib/utils";
import { crab } from "@/src/cmd/commandAdapter";
import type { LikedPost, Post } from "@/src/cmd/commands";
import TweetCard from "@/src/components/twitter/post";
import { Masonry } from "masonic";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { scrollbar } from "../components/scrollbar";
import { useScrollYRef } from "../hooks/scroll";
import { setCenterTool } from "../subpub/centerTool";
import DropdownButton from "../components/dropdownButton";
import DropdownSettings from "../components/dropdownSettings";
import { icons } from "../assets/icons";
import {
  isValidCookies,
  isTwitterLoginCookie,
  detectCookieFormat,
} from "../app/checkCookies";
import { AnimatePresence, motion } from "framer-motion";
import { useScanCheck, setScanCheck } from "../subpub/scanCheck";
import { station } from "../subpub/buses";
// import { fetchAllLikedTweets } from "../app/fetchTwitter";
import { events } from "@/src/cmd/commands";
import { buildAssetToSortidxMap } from "@/src/utils/collectAsset";
import { getAssetState, setAssetState, useAssetState } from "../subpub/assetsState";

interface PostsProps {
  initialPosts?: LikedPost[];
  initialCursor?: number | null;
}

const EditCookies = () => {
  const [cookie, setCookie] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const getCookie = async () => {
      const result = await crab.getUserkvValue("Twitter");
      result.tap((v) => {
        if (!v) return;
        setCookie(v);
        setText(v);
      });
      setLoaded(true);
    };
    getCookie();
  }, []);
  // useEffect(() => {
  //   console.log(isValidCookies(text), detectCookieFormat(text));
  // });
  const buttonCSS = cn([
    "text-sm cursor-pointer select-none py-1 px-2 rounded-md",
    "dark:bg-[#171717] hover:dark:bg-[#262626] bg-[#e5e5e5] hover:bg-[#d4d4d4]",
    "dark:text-[#8a8a8a] hover:dark:text-[#d4d4d4] text-[#404040] hover:text-[#0a0a0a]",
    "transition duration-300",
  ]);
  const check4ui = () => text === cookie || !isTwitterLoginCookie(text);
  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="text-xs text-[#525252] dark:text-[#a3a3a3] select-none cursor-default">
        A cookie is a piece of authentication information generated in your
        browser after you log in. You can use browser extensions such as `Get
        cookies.txt LOCALLY` to get it.
      </div>
      <div className="flex flex-col h-full gap-1">
        <textarea
          value={text}
          placeholder="Paste your cookies"
          onChange={(e) => setText(e.target.value)}
          className="w-full h-full text-xs text-[#404040] dark:text-[#e5e5e5] resize-none outline-none border rounded-md p-1 dark:bg-[#171717] bg-[#fafafa] hide-scrollbar"
          rows={1}
          ref={textareaRef}
        />
        <div className="flex select-none cursor-default justify-between min-h-[28px]">
          <div
            className={cn([
              "flex gap-1 items-center transition duration-200 text-[#df2837]",
              (!loaded || isTwitterLoginCookie(text)) && "opacity-0",
            ])}
          >
            <icons.circleInfo size={12} />
            <div className="text-xs">
              {isValidCookies(text) && !isTwitterLoginCookie(text)
                ? "missing fields"
                : text
                ? "invalid cookies"
                : "should not be empty"}
            </div>
          </div>
          <div className="flex gap-2">
            <div
              className={cn([
                buttonCSS,
                (text !== cookie || !isTwitterLoginCookie(text)) && cookie
                  ? "opacity-100"
                  : "opacity-0 hidden",
              ])}
              onClick={() => {
                setText(cookie);
              }}
            >
              Cancle
            </div>
            <div
              className={cn([
                buttonCSS,
                check4ui() ? "opacity-0 hidden" : "opacity-100",
              ])}
              onClick={() => {
                crab.upsertUserkv("Twitter", text);
                setCookie(text);
                setScanCheck(true);
              }}
            >
              Save
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const settingsItems = [
  {
    name: "Cookies",
    // shortcut: "⌘E",
    fn: () => {},
    data: <EditCookies />,
  },
  {
    name: "Share",
    // shortcut: "⌘S",
    fn: () => {},
    data: <div>分享内容预览或说明文字</div>,
  },
];

const Title = () => {
  const title = station.postsTitle.useValue();
  return <div className="text-trim-cap">{title}</div>;
};

export default function Posts({
  initialPosts = [],
  initialCursor = null,
}: PostsProps) {
  // const [posts, setPosts] = useState<LikedPost[]>(initialPosts);
  // const [sortedIdxList, setSortedIdxList] = useState<number[]>([]);
  const [sortedIdxList, setSortedIdxList] = useState<Array<{ id: number }>>([]);
  const [postsMap, setPostsMap] = useState<Map<number, Post>>(new Map());
  const [asset2sortidx] = useState<Map<string, number>>(new Map());
  const [cursor, setCursor] = useState<number | null>(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const canScan = useScanCheck();

  // 使用自定义 scrollYRef hook，不会导致组件重绘
  useScrollYRef(); // 直接使用，内部已处理滚动条位置更新

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

    if (container.current) {
      resizeObserver.observe(container.current);
    }
    const getCookie = async () => {
      const result = await crab.getUserkvValue("Twitter");
      result.tap((v) => {
        if (v) {
          setScanCheck(true);
        }
      });
    };
    getCookie();

    setCenterTool({
      key: "posts",
      node: (
        <div
          className={cn([
            "flex items-center h-full",
            // "transition duration-300 ease-in-out",
          ])}
        >
          <DropdownButton label="Page Nav" items={settingsItems}>
            <icons.gridCircle size={14} />
          </DropdownButton>

          <DropdownSettings
            // label="User Preferences"
            items={settingsItems}
            className="text-xs font-light h-8"
            o="opacity-80"
            p="px-5"
          >
            <Title />
          </DropdownSettings>
          <DropdownButton label="Settings&Actions" items={settingsItems}>
            <icons.sliders size={14} />
          </DropdownButton>
        </div>
      ),
    });
    const assetEvent = events.assetDownloadBatchEvent.listen((event) => {
      // const prev = getAssetState();
      const newMap = new Map();

      for (const item of event.payload.items) {
        newMap.set(item.aid ?? "0", item.available);
      }

      setAssetState(newMap);
    });

    const scanEvent = events.scanLikesEvent.listen((event) => {
      // event.payload 就是后端发来的数字
      // setCount(event.payload.count);
      // setIsRunning(event.payload.running);
      loadMorePosts();
    });

    return () => {
      if (container.current) {
        resizeObserver.unobserve(container.current);
      }
      resizeObserver.disconnect();
      assetEvent.then((f) => f());
      scanEvent.then((f) => f());
    };
  }, []);

  useEffect(() => {
    if (sortedIdxList.length === 0 && !isLoading) {
      station.postsTitle.setValue("Welcome");
    } else {
      station.postsTitle.setValue("Posts");
    }
  });

  // 加载更多
  const loadMorePosts = useCallback(async () => {
    // if (isLoading || cursor == null || cursor === 0) return;
    setIsLoading(true);

    const result = await crab.takePostChunk(cursor);
    result.match({
      Ok: ({ data, cursor: newCursor }) => {
        // 按 sortidx 降序
        const sortedData = data.sort((a, b) => b.sortidx - a.sortidx);

        setPostsMap((prev) => {
          const next = new Map(prev);
          sortedData.forEach(({ sortidx, post }) => {
            next.set(sortidx, post);
          });
          buildAssetToSortidxMap(sortedData).forEach((sortidx, aid) => {
            asset2sortidx.set(aid, sortidx);
          });
          return next;
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
        console.error("获取帖子失败:", error);
        setSortedIdxList([]);
      },
    });

    setIsLoading(false);
  }, [isLoading, cursor]);

  return (
    <div
      ref={container}
      className={cn([
        "flex justify-center items-center flex-col text-center gap-4 py-4",
        "w-[1186px] mx-auto h-full",
      ])}
    >
      {sortedIdxList.length > 0 ? (
        <Masonry
          items={sortedIdxList}
          overscanBy={6}
          columnGutter={16}
          columnWidth={340}
          maxColumnCount={3}
          render={({ data }) => {
            const post = postsMap.get(data.id);
            return post ? <TweetCard postdata={post} /> : null;
          }}
          onRender={(_startIndex, stopIndex, items) => {
            // 当渲染接近末尾时，加载更多数据
            if (!isLoading && stopIndex >= items.length - 30) {
              // loadMorePosts();
            }
          }}
        />
      ) : isLoading ? (
        <div className="flex justify-center items-center flex-col text-center gap-8 overflow-hidden flex-1 text-gray-500">
          Loading...
        </div>
      ) : (
        <div
          className={cn([
            "flex justify-center items-center flex-col text-center gap-4 overflow-hidden flex-1",
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
                "flex items-center justify-center gap-2",
                "bg-[#e7e7e7] hover:bg-[#d1d1d1] dark:bg-[#171717] dark:hover:bg-[#404040] rounded-md pl-4 pr-5 py-2",
                "hover:shadow-[var(--butty-shadow)]",
                "select-none cursor-pointer",
                "transition duration-300 ease-in-out",
                "text-[#212121] dark:text-[#d4d4d4]",
              ])}
              onClick={async () => {
                // fetchAllLikedTweets();
                const res = await crab.scanLikesTimeline();

                // res.tap((v) => {
                //   setPosts(v);
                //   console.log(v);
                // });
              }}
            >
              <icons.scan size={14} />
              <div className="text-xs">Scan your liked posts</div>
            </div>
          ) : (
            <div className="text-xs text-[#e81123]">
              Cookie is missing. Please click the "Welcome" button at the top to
              add it.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
