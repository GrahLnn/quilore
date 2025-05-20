import { memo } from "react";
import { TweetState } from "./utils";
import { Post, QuotePost } from "@/src/cmd/commands";
import CardEle from "./card";
import ContentEle from "./content";
import MediaGrid from "./lazyMedia";
import QuoteEle from "./quote";

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

export default Detail;
