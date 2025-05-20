import { cn } from "@/lib/utils";
import { Post } from "@/src/cmd/commands";
import { memo } from "react";

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

export default FootTools;
