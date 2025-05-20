import { cn } from "@/lib/utils";
import { QuotePost } from "@/src/cmd/commands";
import { memo } from "react";
import Detail from "./detail";
import { TweetState } from "./utils";
import Author from "./author";

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

export default QuoteEle;
