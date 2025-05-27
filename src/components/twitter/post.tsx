import { cn } from "@/lib/utils";
import type { Post } from "@/src/cmd/commands";
import { memo, useRef, useState } from "react";
import Author from "./author";
import Detail from "./detail";
import FootTools from "./foot";
import TimestampEle from "./timestamp";
import PostTools from "./posttool";
import { station } from "@/src/subpub/buses";

interface TweetCardProps {
  postdata: Post;
  onCollect: (postId: string, collected: boolean, collectAt: string) => void;
}

const TweetCard = memo(function TweetCardComp({
  postdata,
  onCollect,
}: TweetCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const catCheck = station.catCheck.useSee();
  const [collectAts, setCollectAt] = useState<string[]>(
    postdata.collect_at ?? []
  );
  if (!postdata) return null;

  const handleCollect = (collected: boolean, collectAt: string) => {
    setCollectAt(
      collected
        ? [...collectAts, collectAt]
        : collectAts.filter((x: string) => x !== collectAt)
    );
    onCollect(postdata.rest_id, collected, collectAt);
  };
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
          <PostTools postdata={postdata} onCollect={handleCollect} />
        </div>
        {catCheck && collectAts?.includes(catCheck) && (
          <div className="mb-2 flex gap-2">
            <div
              className={cn([
                "text-sm rounded-full trim-ex px-2 py-1",
                "bg-[#e2f1fa] dark:bg-[#293035]",
                "text-gray-700 dark:text-gray-300",
              ])}
            >
              {catCheck}
            </div>
          </div>
        )}
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
