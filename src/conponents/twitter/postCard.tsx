import { cn } from "@/lib/utils";
import { icons } from "@/src/assets/icons";
import type { Card, Content, Post, QuotePost, User } from "@/src/cmd/commands";
import { convertFileSrc } from "@tauri-apps/api/core";
import punycode from "punycode";
import { memo, useState } from "react";
import ShowMedia from "./lazyMedia";
import { TweetState } from "./utils";

const libraryPath = "C:\\Users\\grahl\\quill";
const compath = (path: string) => `${libraryPath}\\${path}`;

function ContentEle({ content }: { content: Content }) {
  if (!content.text) return null;

  // 处理文本和链接
  let displayText = content.text;

  // 如果有扩展URL，按长度降序排序处理
  if (content.expanded_urls && content.expanded_urls.length > 0) {
    const sortedUrls = [...content.expanded_urls].sort(
      (a, b) => b.length - a.length
    );

    // 用占位符替换URL
    const placeholders: Record<string, string> = {};
    let i = 0;
    for (const url of sortedUrls) {
      const placeholder = `__URL_PLACEHOLDER_${i}__`;
      placeholders[placeholder] = url;
      displayText = displayText.split(url).join(placeholder);
      i++;
    }

    // 分割文本并创建带链接的JSX元素
    let parts: (string | React.ReactNode)[] = [displayText];

    // 处理每个占位符
    for (const [placeholder, url] of Object.entries(placeholders)) {
      // 创建新的parts数组
      const newParts: (string | React.ReactNode)[] = [];

      for (const [idx, part] of parts.entries()) {
        if (typeof part === "string") {
          // 分割字符串部分
          const splitParts = part.split(placeholder);

          // 处理分割后的部分
          for (let i = 0; i < splitParts.length; i++) {
            const text = splitParts[i];

            if (i > 0) {
              // 获取URL的最后一段作为链接文本
              const urlParts = url
                .split("/")
                .filter((segment) => segment.length > 0);
              const linkText = urlParts.length
                ? urlParts[urlParts.length - 1]
                : url;

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

    return (
      <div className="whitespace-pre-wrap break-words w-full text-left text-[var(--content)]">
        {parts}
      </div>
    );
  }

  return (
    <div className="whitespace-pre-wrap break-words w-full text-left text-[var(--content)]">
      {displayText}
    </div>
  );
}

function CardEle({ card }: { card?: Card | null }) {
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
}

const showLangIcon = (_tweet: Post | QuotePost) => null; // 占位

function QuoteEle({ quote }: { quote?: QuotePost | null }) {
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
        <span className="flex gap-0.5">{showLangIcon(quote)}</span>
      </div>
      <Detail tweet={quote} state={TweetState.Quote} />
    </div>
  );
}

function Detail({
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
      <ShowMedia media={tweet.media} state={state} />
      {"quote" in tweet && <QuoteEle quote={tweet.quote} />}
    </div>
  );
}

function Timestamp({ timestamp }: { timestamp: string }): string {
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
}

const FootTools = ({ tweet }: { tweet: Post }) => {
  return (
    <a
      href={`https://x.com/i/status/${tweet.rest_id}`}
      className={cn(
        "text-[0.85em] text-sky-500 trim-cap",
        "hover:underline transition-all duration-300 ease-in-out"
      )}
      target="_blank"
      rel="noreferrer"
    >
      View on 𝕏
    </a>
  );
};
const generateReplyHTML = (_t: Post) => null;

interface AuthorProps {
  author: User;
  size?: "small" | "normal";
}
function Author({ author, size = "normal" }: AuthorProps) {
  return (
    <a
      href={`https://x.com/${author.screen_name}`}
      target="_blank"
      rel="noreferrer"
    >
      <div className="flex gap-2 group">
        <img
          src={convertFileSrc(compath(author.avatar.path))}
          alt="Avatar"
          className={cn(["rounded-full object-cover w-8 h-8"])}
        />

        <div
          className={cn([
            "flex flex-col items-start pt-[4px]",
            size === "normal" && "gap-2",
            size === "small" && "gap-1.5",
          ])}
        >
          <div className={cn(["font-bold text-[var(--content)] trim-cap"])}>
            {punycode.toUnicode(author.name)}
          </div>

          <div
            className={cn([
              "text-gray-500 dark:text-[#6e6e6e] trim-cap text-[0.85em]",
            ])}
          >
            @{author.screen_name}
          </div>
        </div>
      </div>
    </a>
  );
}

interface CardButtomProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const CardButtom = ({ children, className, onClick }: CardButtomProps) => {
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className={cn([
        "p-1.5 hover:bg-[#e6e6e7] dark:hover:bg-[#212121]",
        "rounded-md cursor-default",
        "transition-all duration-300 ease-in-out",
        className,
      ])}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const CardTools = memo(() => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex gap-0.5"
      // onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered ? (
        <>
          <CardButtom>
            <icons.pin size={14} />
          </CardButtom>
          <CardButtom>
            <icons.duplicate2 size={14} />
          </CardButtom>
          <CardButtom>
            <icons.globe3 size={14} />
          </CardButtom>
          <CardButtom>
            <icons.fullScreen4 size={14} />
          </CardButtom>
        </>
      ) : (
        <CardButtom className="opacity-90" onClick={() => setIsHovered(true)}>
          <icons.dots size={14} />
        </CardButtom>
      )}
    </div>
  );
});

interface TweetCardProps {
  postdata: Post;
}

const TweetCard = memo(({ postdata }: TweetCardProps) => {
  if (!postdata) return null;
  return (
    <div
      className={cn(
        "flex flex-col p-3 cursor-default bg-white dark:bg-[#0f0f0f]",
        "border border-[#e1e8ed] dark:border-[#212121] rounded-lg",
        "select-none transition-all duration-500"
      )}
    >
      <div className="flex flex-col text-[14px]">
        <div className="mb-2 flex justify-between items-start">
          <Author author={postdata.author} />
          <CardTools />
        </div>
        <Detail tweet={postdata} />
        <div style={{ marginTop: "8px" }}>
          <div className="mt-0.5 flex justify-between items-center">
            <span className="text-[#657786] dark:text-[#6e6e6e] text-[0.8em] text-nowrap text-trim-cap">
              <Timestamp timestamp={postdata.created_at ?? ""} />
            </span>
            <FootTools tweet={postdata} />
          </div>
        </div>
      </div>
      {/* {generateReplyHTML(postdata)} */}
    </div>
  );
});

export default TweetCard;
