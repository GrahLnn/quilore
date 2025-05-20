import { cn } from "@/lib/utils";
import { User } from "@/src/cmd/commands";
import { memo } from "react";
import LazyImage from "../lazyimg";
import punycode from "punycode/";

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

export default Author;
