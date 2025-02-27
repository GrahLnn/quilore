import { useEffect } from "react";
import { tweet } from "../assets/testData";
import { cn } from "@/lib/utils";
import { icons } from "../assets/icons";
import { convertFileSrc } from "@tauri-apps/api/core";
import punycode from "punycode";
import type {
  Post,
  Content,
  Media,
  VideoMedia,
  AnimatedGifMedia,
  Card,
  Author,
} from "../interface";

const libraryPath = "C:\\Users\\grahl\\quill";
const compath = (path: string) => {
  return `${libraryPath}\\${path}`;
};

enum TweetState {
  Post = "post",
  Quote = "quote",
  Reply = "reply",
}

// 占位函数
const showLangIcon = (tweet: Post) => {
  return null; // 待实现
};

const showContent = (content: Content) => {
  if (!content.text) return;
  return (
    <div
      className={cn(
        "whitespace-pre-wrap break-words relative will-change-transform w-full text-left"
      )}
    >
      {content.text}
    </div>
  );
};

const generateMediaHtml = (media: Media, state: TweetState) => {
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

  const getAspectRatio = (media: VideoMedia | AnimatedGifMedia) => {
    const [width = 16, height = 9] = media.aspect_ratio ?? [];
    return `${Math.min((height / width) * 100, 100)}%`;
  };

  switch (media.type) {
    case "photo":
      return (
        <img
          className={cn(
            baseMediaClass,
            "object-cover cursor-pointer hover:opacity-90 transition-opacity duration-200"
          )}
          src={convertFileSrc(compath(media.path))}
          loading="lazy"
          alt="media"
        />
      );
    case "video": {
      const isLoop = (media.duration_millis ?? 0) < 31000;
      return (
        <div
          className="relative w-full"
          style={{ paddingBottom: getAspectRatio(media) }}
        >
          {/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
          <video
            className={cn(baseMediaClass, "absolute inset-0 h-full max-h-100")}
            controls
            preload="none"
            playsInline
            poster={media.thumb_path}
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
    case "animated_gif": {
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
    }
    default:
      return null;
  }
};

const showMedia = (state: TweetState, media?: Array<Media>) => {
  if (!media) return;
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
      {media.map((item) => (
        <div key={item.id}> {generateMediaHtml(item, state)}</div>
      ))}
    </div>
  );
};

const showCard = (card?: Card) => {
  if (!card) return;
  return (
    <a
      href={card.url}
      className="block no-underline text-inherit"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div
        className={cn(
          "border border-[#e1e8ed] rounded-lg p-[10px]",
          "flex flex-col gap-1.5",
          "text-[0.95em]",
          "cursor-pointer",
          "transition-all duration-200 ease-in-out",
          "hover:bg-[var(--card-bg)] hover:shadow-[var(--butty-shadow)]"
        )}
      >
        <div className="text-sm font-bold text-[#14171a] mb-1 text-left">
          {card.title}
        </div>
        {card.description && (
          <div className="text-xs text-gray-700 break-words text-left">
            {card.description}
          </div>
        )}
      </div>
    </a>
  );
};

const showQuote = (quote?: Post) => {
  if (!quote) return;
  return (
    <div
      className={cn(
        "border border-[#e1e8ed] rounded-lg",
        "p-2.5",
        "bg-[#f8f9fa]",
        "text-[0.95em]"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2">
          <div className="flex justify-center items-center">
            <img
              src={convertFileSrc(compath(quote.author.avatar.path))}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-bold text-[#14171a] text-sm">
              {punycode.toUnicode(quote.author.name)}
            </span>
            <span className="text-[#6a737d] text-xs">
              @{quote.author.screen_name}
            </span>
          </div>
        </div>
        <span className="flex gap-0.5">{showLangIcon(quote)}</span>
      </div>
      {showDetail(quote, TweetState.Quote)}
    </div>
  );
};

const showDetail = (tweet: Post, state = TweetState.Post) => {
  const content = showContent(tweet.content);
  const media = showMedia(state, tweet.media);
  const card = showCard(tweet.card);
  const quote = showQuote(tweet.quote);
  return (
    <div className="flex flex-col gap-2">
      {content}
      {media}
      {card}
      {quote}
    </div>
  );
};

function formatTimestamp(timestamp: string, fmt = "%Y-%m-%d %H:%M"): string {
  if (!timestamp) {
    return "";
  }
  const timeFormat = "%a %b %d %H:%M:%S %z %Y";
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

const footerToolHTML = (tweet: Post) => {
  return null; // 待实现
};

const generateReplyHTML = (tweet: Post) => {
  return null; // 待实现
};

const showUser = (author: Author) => {
  return (
    <div className="flex gap-2">
      <div className="flex justify-center items-center">
        <img
          src={convertFileSrc(compath(author.avatar.path))}
          alt="Avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
      </div>
      <div className="flex flex-col items-start">
        <span className="font-bold text-[#14171a]">
          {punycode.toUnicode(author.name)}
        </span>
        <span className="text-gray-500 text-[0.85em]">
          @{author.screen_name}
        </span>
      </div>
    </div>
  );
};

export default function TweetCard() {
  return (
    <div className="p-3 bg-white flex flex-col border border-[#e1e8ed] rounded-lg w-[390px] cursor-default">
      <div className="flex flex-col text-[14px]">
        <div className="mb-2 flex justify-between items-start">
          {showUser(tweet.author)}
          <span className="flex gap-0.5">
            {showLangIcon(tweet)}
            <div className="pin">{icons.pin({ size: 14 })}</div>
          </span>
        </div>
        {showDetail(tweet)}
        <div style={{ marginTop: "8px" }}>
          <div className="mt-0.5 flex justify-between items-center">
            <div className="flex">
              <span className="text-[#657786] text-[0.8em] text-nowrap">
                {formatTimestamp(tweet.created_at)}
              </span>
            </div>
            {footerToolHTML(tweet)}
          </div>
        </div>
      </div>
      {generateReplyHTML(tweet)}
    </div>
  );
}
