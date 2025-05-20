import { cn } from "@/lib/utils";
import { Card } from "@/src/cmd/commands";
import { memo } from "react";

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

export default CardEle;
