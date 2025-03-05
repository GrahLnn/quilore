import { memo, useEffect } from "react";
// import { tweet } from "../assets/testData";
import { cn } from "@/lib/utils";
import { icons } from "@/src/assets/icons";
import { convertFileSrc } from "@tauri-apps/api/core";
import punycode from "punycode";
import type {
  Post,
  Content,
  Media,
  VideoMedia,
  AnimatedGifMedia,
  Card,
  User,
  QuotePost,
} from "@/src/cmd/commands";
import {
  isLandscape,
  permutations,
  scaleMediaList,
  calcTotalHeight,
  TweetState,
} from "./utils";
import { box } from "../lightbox";

const libraryPath = "C:\\Users\\grahl\\quill";
const compath = (path: string) => `${libraryPath}\\${path}`;

const generateMediaElement = (media: Media, state: TweetState) => {
  if (media.path === "media unavailable") {
    return (
      <div className="bg-gray-50 text-gray-500 p-4 text-center rounded-lg border border-dashed border-gray-300 italic">
        Media Unavailable
      </div>
    );
  }
  const baseMediaClass = cn(
    "w-full",
    state === TweetState.Quote ? "rounded-[4px]" : "rounded-lg"
  );
  const getAspectRatio = (m: VideoMedia | AnimatedGifMedia) => {
    const [w = 16, h = 9] = m.aspect_ratio ?? [];
    return `${Math.min((h / w) * 100, 100)}%`;
  };

  switch (media.type) {
    case "photo": {
      const handleOpenLightbox = () => {
        box.open([convertFileSrc(compath(media.path))], 0);
      };
      return (
        // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
        <img
          className={cn(
            baseMediaClass,
            "object-cover cursor-pointer hover:opacity-90 transition-opacity duration-200"
          )}
          src={convertFileSrc(compath(media.path))}
          onClick={handleOpenLightbox}
          loading="lazy"
          alt="media"
        />
      );
    }
    case "video": {
      const isLoop = (media.duration_millis ?? 0) < 600000;
      return (
        <div
          className="relative w-full"
          style={{ paddingBottom: getAspectRatio(media) }}
        >
          <video
            className={cn(baseMediaClass, "absolute inset-0 h-full max-h-100")}
            controls
            preload="auto"
            playsInline
            muted
            autoPlay
            poster={media.thumb_path || ""}
            loop={isLoop}
            aria-label={media.description || "Video content"}
          >
            <source
              src={convertFileSrc(compath(media.path))}
              type="video/mp4"
            />
            Your browser does not support video.
          </video>
        </div>
      );
    }
    case "animated_gif":
      return (
        <div
          className="relative w-full"
          style={{ paddingBottom: getAspectRatio(media) }}
        >
          <video
            className={cn(baseMediaClass, "absolute inset-0 h-full max-h-100")}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          >
            <source
              src={convertFileSrc(compath(media.path))}
              type="video/mp4"
            />
            Your browser does not support video.
          </video>
        </div>
      );
    default:
      return null;
  }
};

function showMedia(state: TweetState, media?: Media[] | null) {
  if (!media?.length) return null;
  const count = media.length;
  if (count === 1) {
    return (
      <div className="w-full">{generateMediaElement(media[0], state)}</div>
    );
  }
  if (count === 2) {
    const [m1, m2] = media;
    const bothLandscape = isLandscape(m1) && isLandscape(m2);
    const bothPortrait = !isLandscape(m1) && !isLandscape(m2);
    if (bothLandscape) {
      return (
        <div className="flex flex-col gap-2">
          {generateMediaElement(m1, state)}
          {generateMediaElement(m2, state)}
        </div>
      );
    }
    if (bothPortrait) {
      return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
          {generateMediaElement(m1, state)}
          {generateMediaElement(m2, state)}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {isLandscape(m1) ? (
          <>
            {generateMediaElement(m1, state)}
            {generateMediaElement(m2, state)}
          </>
        ) : (
          <>
            {generateMediaElement(m2, state)}
            {generateMediaElement(m1, state)}
          </>
        )}
      </div>
    );
  }
  if (count === 3) {
    const wideCount = media.filter(isLandscape).length;
    const tallCount = 3 - wideCount;
    if (wideCount === 3) {
      return (
        <div className="flex flex-col gap-2">
          {media.map((m) => (
            <div key={m.id} className="w-full h-auto overflow-hidden">
              {generateMediaElement(m, state)}
            </div>
          ))}
        </div>
      );
    }
    if (tallCount === 3) {
      return (
        <div className="flex flex-row gap-2">
          {media.map((m) => (
            <div key={m.id} className="w-full h-auto overflow-hidden">
              {generateMediaElement(m, state)}
            </div>
          ))}
        </div>
      );
    }
    if (wideCount === 2 && tallCount === 1) {
      const tIndex = media.findIndex((m) => !isLandscape(m));
      const tall = media[tIndex];
      const wide = media.filter((_, i) => i !== tIndex);
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-2">
            {wide.map((m) => (
              <div key={m.id}>{generateMediaElement(m, state)}</div>
            ))}
          </div>
          <div>{generateMediaElement(tall, state)}</div>
        </div>
      );
    }
    if (wideCount === 1 && tallCount === 2) {
      const wIndex = media.findIndex(isLandscape);
      const wide = media[wIndex];
      const tall = media.filter((_, i) => i !== wIndex);
      return (
        <div className="flex flex-col gap-2">
          <div>{generateMediaElement(wide, state)}</div>
          <div className="flex flex-row gap-2">
            {tall.map((m) => (
              <div key={m.id}>{generateMediaElement(m, state)}</div>
            ))}
          </div>
        </div>
      );
    }
  }
  if (count === 4) {
    const scaled = scaleMediaList(media);
    const idxArr = [0, 1, 2, 3];
    let minHeight = Number.POSITIVE_INFINITY;
    let bestOrder: number[] = idxArr;
    for (const order of permutations(idxArr)) {
      const totalH = calcTotalHeight(scaled, order);
      if (totalH < minHeight) {
        minHeight = totalH;
        bestOrder = order;
      }
    }
    const arranged = bestOrder.map((i) => scaled[i]);
    return (
      <div className="flex gap-2">
        <div className="flex flex-col gap-2 flex-1">
          {generateMediaElement(arranged[0], state)}
          {generateMediaElement(arranged[2], state)}
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {generateMediaElement(arranged[1], state)}
          {generateMediaElement(arranged[3], state)}
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
      {media.map((m) => (
        <div key={m.id}>{generateMediaElement(m, state)}</div>
      ))}
    </div>
  );
}

// ========== 其他UI处理 ==========

function showContent(content: Content) {
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

      for (const part of parts) {
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
                  key={`link-${placeholder}-${i}`}
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

  // 如果没有链接，直接返回文本
  return (
    <div className="whitespace-pre-wrap break-words w-full text-left text-[var(--content)]">
      {displayText}
    </div>
  );
}

function showCard(card?: Card | null) {
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

function showQuote(quote?: QuotePost | null) {
  if (!quote) return null;
  return (
    <div
      className={cn(
        "border border-[#e1e8ed] dark:border-[#212121] rounded-lg",
        "p-2.5 bg-[#f8f9fa] dark:bg-[#171717] text-[0.95em]"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2">
          <img
            src={convertFileSrc(compath(quote.author.avatar.path))}
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex flex-col items-start">
            <span className="font-bold text-[#14171a] dark:text-[#ffffff] text-sm">
              {punycode.toUnicode(quote.author.name)}
            </span>
            <span className="text-[#6a737d] dark:text-[#6e6e6e] text-xs">
              @{quote.author.screen_name}
            </span>
          </div>
        </div>
        <span className="flex gap-0.5">{showLangIcon(quote)}</span>
      </div>
      {showDetail(quote, TweetState.Quote)}
    </div>
  );
}

function showDetail(tweet: Post | QuotePost, state = TweetState.Post) {
  return (
    <div className="flex flex-col gap-2">
      {showContent(tweet.content)}
      {showMedia(state, tweet.media)}
      {showCard(tweet.card)}
      {"quote" in tweet ? showQuote(tweet.quote) : null}
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
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

// 以下函数占位
const footerToolHTML = (_t: Post) => null;
const generateReplyHTML = (_t: Post) => null;

function showUser(author: User) {
  return (
    <div className="flex gap-2">
      <img
        src={convertFileSrc(compath(author.avatar.path))}
        alt="Avatar"
        className="w-8 h-8 rounded-full object-cover"
      />
      <div className="flex flex-col items-start gap-2 pt-[2px]">
        <div className="font-bold text-[var(--content)] text-trim-cap">
          {punycode.toUnicode(author.name)}
        </div>
        <div className="text-gray-500 dark:text-[#6e6e6e] text-[0.85em] text-trim-cap">
          @{author.screen_name}
        </div>
      </div>
    </div>
  );
}

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
        "select-none"
      )}
    >
      <div className="flex flex-col text-[14px]">
        <div className="mb-2 flex justify-between items-start">
          {showUser(postdata.author)}
          <span className="flex gap-0.5">
            {showLangIcon(postdata)}
            <div className="pin">{icons.pin({ size: 14 })}</div>
          </span>
        </div>
        {showDetail(postdata)}
        <div style={{ marginTop: "8px" }}>
          <div className="mt-0.5 flex justify-between items-center">
            <span className="text-[#657786] dark:text-[#6e6e6e] text-[0.8em] text-nowrap">
              {formatTimestamp(postdata.created_at ?? "")}
            </span>
            {footerToolHTML(postdata)}
          </div>
        </div>
      </div>
      {generateReplyHTML(postdata)}
    </div>
  );
});

// const TweetCard = ({ postdata }: TweetCardProps) => {
//   if (!postdata) return null;
//   return (
//     <div
//       className={cn(
//         "flex flex-col w-[390px] p-3 cursor-default bg-white dark:bg-[#0f0f0f]",
//         "border border-[#e1e8ed] dark:border-[#212121] rounded-lg"
//       )}
//     >
//       <div className="flex flex-col text-[14px]">
//         <div className="mb-2 flex justify-between items-start">
//           {showUser(postdata.author)}
//           <span className="flex gap-0.5">
//             {showLangIcon(postdata)}
//             <div className="pin">{icons.pin({ size: 14 })}</div>
//           </span>
//         </div>
//         {showDetail(postdata)}
//         <div style={{ marginTop: "8px" }}>
//           <div className="mt-0.5 flex justify-between items-center">
//             <span className="text-[#657786] dark:text-[#6e6e6e] text-[0.8em] text-nowrap">
//               {formatTimestamp(postdata.created_at ?? "")}
//             </span>
//             {footerToolHTML(postdata)}
//           </div>
//         </div>
//       </div>
//       {generateReplyHTML(postdata)}
//     </div>
//   );
// };

export default TweetCard;
