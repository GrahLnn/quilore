import { cn } from "@/lib/utils";
import type { Post } from "@/src/cmd/commands";
import { memo, useRef } from "react";
import Author from "./author";
import Detail from "./detail";
import FootTools from "./foot";
import TimestampEle from "./timestamp";
import PostTools from "./posttool";

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
          <PostTools postdata={postdata} />
        </div>
        <Detail tweet={postdata} />
        <div style={{ marginTop: "8px" }}>
          <div className="mt-0.5 flex justify-between items-center">
            <span className="text-[#657786] dark:text-[#6e6e6e] text-[0.8em] text-nowrap text-trim-cap">
              <TimestampEle time={postdata.created_at ?? ""} />
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
