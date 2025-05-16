import * as punycode from "punycode";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Matchable } from "@/lib/matchable";
import { cn } from "@/lib/utils";
import { icons } from "@/src/assets/icons";
import { crab } from "@/src/cmd/commandAdapter";
import type { Card, Content, Post, QuotePost, User } from "@/src/cmd/commands";
import type { ContentToCopy } from "@/src/cmd/commands";
import { useLanguageState } from "@/src/state_machine/language";
import { DataTag } from "@/src/utils/enums";
import { AnimatePresence, motion } from "motion/react";
import { memo, useLayoutEffect, useMemo, useRef, useState } from "react";
import MediaGrid from "./lazyMedia";
import { TweetState } from "./utils";
import LazyImage from "../lazyimg";
import md5 from "md5";

function processText(text: string, urls: string[] | null) {
  let parts: (string | React.ReactNode)[] | string = text;
  if (urls && urls.length > 0) {
    const sortedUrls = [...urls].sort((a, b) => b.length - a.length);

    // 用占位符替换URL
    const placeholders: Record<string, string> = {};
    let processedText = text;
    for (const [i, url] of sortedUrls.entries()) {
      const placeholder = `__URL_PLACEHOLDER_${i}__`;
      placeholders[placeholder] = url;
      processedText = processedText.split(url).join(placeholder);
    }

    // 分割文本并创建带链接的JSX元素
    parts = [processedText];

    // 处理每个占位符
    for (const [placeholder, url] of Object.entries(placeholders)) {
      // 创建新的parts数组
      const newParts: (string | React.ReactNode)[] = [];

      for (const part of parts) {
        if (typeof part === "string") {
          // 分割字符串部分
          const splitParts = part.split(placeholder);

          // 处理分割后的部分
          for (let i = 0; i < splitParts.length; i++) {
            const text = splitParts[i];

            if (i > 0) {
              const parsedUrl = new URL(url);
              const pathnameParts = parsedUrl.pathname
                .split("/")
                .filter((part) => part.length > 0);

              const lastSegment = pathnameParts.length
                ? `[${decodeURIComponent(pathnameParts[pathnameParts.length - 1])}]`
                : "";

              const linkText = `${parsedUrl.hostname}${lastSegment}`;

              // 添加链接元素
              newParts.push(
                <a
                  key={crypto.randomUUID().slice(0, 8)}
                  href={url}
                  target="_blank"
                  className="text-sky-500 hover:underline"
                  rel="noreferrer"
                >
                  {linkText}
                </a>
              );
            }

            if (text) {
              newParts.push(text);
            }
          }
        } else {
          // 保留非字符串元素
          newParts.push(part);
        }
      }
      parts = newParts;
    }
  }
  return parts;
}

enum LangStateKey {
  original = "original",
  translated = "translated",
}

const ContentEle = memo(function ContentEleComp({
  content,
}: {
  content: Content;
}) {
  const langState = useLanguageState();
  // 定义两个容器的 ref，分别用于显示内容和隐藏测量
  const containerRef = useRef<HTMLDivElement>(null);
  const hideRef = useRef<HTMLDivElement>(null);
  // 使用 useState 存储两个高度值，初始值均为 "auto"
  const [heights, setHeights] = useState<{
    cont: number | "auto";
    hide: number | "auto";
  }>({
    cont: "auto",
    hide: "auto",
  });
  const { displayText, animationKey, symmetryText } = langState.match({
    original: () => ({
      displayText: content.text,
      animationKey: LangStateKey.original + md5(content.text),
      symmetryText:
        content.translation && content.translation !== DataTag.NO_TRANSLATION
          ? content.translation
          : content.text,
    }),
    translated: () => ({
      displayText:
        content.translation && content.translation !== DataTag.NO_TRANSLATION
          ? content.translation
          : content.text,
      animationKey:
        content.translation && content.translation !== DataTag.NO_TRANSLATION
          ? LangStateKey.translated + md5(content.translation)
          : LangStateKey.original + md5(content.text),
      symmetryText: content.text,
    }),
  });
  const parts = useMemo(
    () => processText(displayText, content.expanded_urls),
    [displayText, content.expanded_urls]
  );
  const symmetryParts = useMemo(
    () => processText(symmetryText, content.expanded_urls),
    [symmetryText, content.expanded_urls]
  );
  // 组件加载时只测量一次两个容器的高度，并保存下来（固定数据，不再变化）
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useLayoutEffect(() => {
    const containerEl = containerRef.current;
    const hideEl = hideRef.current;
    if (containerEl && hideEl) {
      const { contH, hideH } = langState.match({
        original: () => ({
          contH: containerEl.offsetHeight,
          hideH: hideEl.offsetHeight,
        }),
        translated: () => ({
          contH: hideEl.offsetHeight,
          hideH: containerEl.offsetHeight,
        }),
      });
      setHeights({
        cont: contH,
        hide: hideH,
      });
    }
  }, []);
  // 在测量完成后移除hideRef元素
  useLayoutEffect(() => {
    if (heights.hide !== "auto") {
      setHideRefMeasured(true);
    }
  }, [heights.hide]);

  // 添加一个状态来控制是否显示hideRef元素
  const [hideRefMeasured, setHideRefMeasured] = useState(false);
  if (!content.text) return null;

  const defaultCN =
    "whitespace-pre-wrap break-words w-full text-left text-[var(--content)]";

  // 根据当前语言状态选择对应的高度值
  const height = langState.match({
    original: () => heights.cont,
    translated: () => heights.hide,
  });

  return (
    // 外层容器负责高度过渡动画
    <motion.div
      transition={{ duration: 0.1, ease: "linear" }}
      animate={{ height: height }}
      className="relative select-none"
    >
      <AnimatePresence mode="wait">
        <motion.div
          ref={containerRef}
          key={animationKey}
          className={cn([defaultCN])}
          // initial={{ filter: "blur(6px)", opacity: 0 }}
          // animate={{ filter: "blur(0px)", opacity: 1 }}
          // exit={{ filter: "blur(6px)", opacity: 0 }}
          transition={{
            duration: 0.3,
            ease: "linear",
            filter: { clampWhenFinished: true },
          }}
        >
          {parts}
        </motion.div>
      </AnimatePresence>
      {!hideRefMeasured && (
        <div
          ref={hideRef}
          className={cn([defaultCN, "absolute top-0 left-0 w-full opacity-0"])}
        >
          {symmetryParts}
        </div>
      )}
    </motion.div>
  );
});

const CardEle = memo(function CardEleComp({ card }: { card?: Card | null }) {
  if (!card) return null;
  return (
    <a
      href={card.url}
      className="block no-underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div
        className={cn(
          "border border-[#e1e8ed] dark:border-[#212121] rounded-lg p-[10px]",
          "flex flex-col gap-1.5 text-[0.95em] cursor-pointer",
          "transition-all duration-500 ease-in-out",
          "hover:bg-[var(--card-bg)] hover:shadow-[var(--butty-shadow)]"
        )}
      >
        <div className="text-sm font-bold text-[var(--content)] mb-1 text-left">
          {card.title}
        </div>
        {card.description && (
          <div className="text-xs text-gray-700 dark:text-[#6e6e6e] break-words text-left">
            {card.description}
          </div>
        )}
      </div>
    </a>
  );
});

const QuoteEle = memo(function QuoteEleComp({
  quote,
}: {
  quote?: QuotePost | null;
}) {
  if (!quote) return null;
  return (
    <div
      className={cn(
        "border border-[#e1e8ed] dark:border-[#212121] rounded-lg",
        "p-2.5 bg-[#f8f9fa] dark:bg-[#171717] text-[0.95em]",
        "transition-all duration-500"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <Author author={quote.author} size="small" />
      </div>
      <Detail tweet={quote} state={TweetState.Quote} />
    </div>
  );
});

const Detail = memo(function DetailComp({
  tweet,
  state = TweetState.Post,
}: {
  tweet: Post | QuotePost;
  state?: TweetState;
}) {
  return (
    <div className="flex flex-col gap-2">
      <ContentEle content={tweet.content} />
      <CardEle card={tweet.card} />
      <MediaGrid medias={tweet.media} state={state} />
      {"quote" in tweet && <QuoteEle quote={tweet.quote} />}
    </div>
  );
});

interface TimestampCompProps {
  timestamp: string;
}

const TimestampEle = memo(function TimestampComp({
  timestamp,
}: TimestampCompProps) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date
    .toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/\//g, "-");
});

const FootTools = memo(function FootToolsComp({
  tweet,
  className,
}: {
  tweet: Post;
  className?: string;
}) {
  return (
    <a
      href={`https://x.com/i/status/${tweet.rest_id}`}
      className={cn(
        "text-[0.85em] text-sky-500 trim-cap",
        "hover:underline transition-all duration-300 ease-in-out",
        className
      )}
      target="_blank"
      rel="noreferrer"
    >
      View on 𝕏
    </a>
  );
});

interface AuthorProps {
  author: User;
  size?: "small" | "normal";
}
const Author = memo(function AuthorComp({ author }: AuthorProps) {
  return (
    // <a
    //   href={`https://x.com/${author.screen_name}`}
    //   target="_blank"
    //   rel="noreferrer"
    // >
    <div className="flex gap-2 group overflow-hidden z-0">
      <LazyImage
        src={author.avatar.path}
        asset={author.avatar}
        className={cn(["rounded-full object-cover w-8 h-8"])}
        holderCn="w-8 h-8"
      />

      <div
        className={cn([
          "flex flex-col items-start overflow-hidden",
          "relative -top-0.5",
        ])}
      >
        <div
          className={cn([
            "font-semibold text-[var(--content)] text-left truncate w-full",
          ])}
        >
          {punycode.toUnicode(author.name.trim())}
        </div>

        <div
          className={cn([
            "text-gray-500 dark:text-[#6e6e6e] trim-cap text-[0.85em]",
          ])}
        >
          <span style={{ fontFamily: '"Maple Mono", monospace' }}>@</span>
          {author.screen_name}
        </div>
      </div>
    </div>
    // </a>
  );
});

interface CardToolItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const CardToolItem = memo(function CardToolItemComp({
  icon,
  label,
  onClick,
}: CardToolItemProps) {
  return (
    <DropdownMenuItem onClick={onClick}>
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
    </DropdownMenuItem>
  );
});

function buildContent(
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

interface CardToolsProps extends React.HTMLAttributes<HTMLDivElement> {
  postdata: Post;
}

const CardTools = memo(function CardToolsComp({
  postdata,
  className,
}: CardToolsProps) {
  const lang = useLanguageState();
  const handleCopy = () => {
    const content = buildContent(postdata, lang);
    crab.copyToClipboard(content);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn([
          "focus:outline-none focus:ring-0 focus:border-0",
          "p-1.5 hover:bg-[#e6e6e7] dark:hover:bg-[#212121] opacity-90",
          "data-[state=open]:bg-[#e6e6e7] dark:data-[state=open]:bg-[#212121]",
          "rounded-md cursor-default",
          "transition-all duration-300 ease-in-out",
          "group-hover:opacity-100 data-[state=open]:opacity-100 opacity-0 transition duration-300",
          className,
        ])}
      >
        <icons.dots size={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <CardToolItem icon={<icons.pin size={14} />} label="Pin" />
        <CardToolItem
          icon={<icons.duplicate2 size={14} />}
          label="Copy Content"
          onClick={handleCopy}
        />
        {/* <CardToolItem icon={<icons.globe3 size={14} />} label="Translate" /> */}
        <CardToolItem icon={<icons.fullScreen4 size={14} />} label="Expand" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

interface TweetCardProps {
  postdata: Post;
}

const TweetCard = memo(function TweetCardComp({ postdata }: TweetCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  if (!postdata) return null;
  return (
    <div
      ref={wrapperRef}
      className={cn(
        "flex flex-col p-3 cursor-default bg-white dark:bg-[#0f0f0f]",
        "border border-[#e1e8ed] dark:border-[#212121] rounded-xl",
        "transition-all duration-500",
        "select-none group"
      )}
    >
      <div className="flex flex-col text-[14px]">
        <div className="mb-2 flex justify-between items-start gap-4">
          <Author author={postdata.author} />
          <CardTools postdata={postdata} />
        </div>
        <Detail tweet={postdata} />
        <div style={{ marginTop: "8px" }}>
          <div className="mt-0.5 flex justify-between items-center">
            <span className="text-[#657786] dark:text-[#6e6e6e] text-[0.8em] text-nowrap text-trim-cap">
              <TimestampEle timestamp={postdata.created_at ?? ""} />
            </span>
            <FootTools
              className="group-hover:opacity-100 opacity-0 transition duration-300"
              tweet={postdata}
            />
          </div>
        </div>
      </div>
      {/* {generateReplyHTML(postdata)} */}
    </div>
  );
});

export default TweetCard;
