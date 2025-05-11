import { cn } from "@/lib/utils";
import type { Media } from "@/src/cmd/commands";
import { convertFileSrc } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import type { JSX } from "react";
import LazyImage from "../lazyimg";
import LazyVideo from "../lazyvideo";
import { TweetState, calcLayout, isLandscape } from "./utils";
import { openLightbox, closeLightbox } from "../modalbox/lightbox";
import { getSrc } from "@/src/utils/file";
import { crab } from "@/src/cmd/commandAdapter";
import { station } from "@/src/subpub/buses";
import { useState, useEffect } from "react";

interface LazyMediaProps {
  media: Media;
  state: TweetState;
}

const MediaElement = ({ media, state }: LazyMediaProps) => {
  const savedir = station.saveDir.watch();
  if (!savedir) return;
  const errcn =
    "bg-gray-50 text-gray-500 p-4 text-center rounded-lg border border-dashed border-gray-300 italic";
  if (media.asset.path === "media unavailable") {
    return <div className={errcn}>Media Unavailable</div>;
  }
  if (!media.width || !media.height) {
    return <div className={errcn}>Media Information Incomplete</div>;
  }

  const baseMediaClass = cn(
    "w-full",
    state === TweetState.Quote ? "rounded-[2px]" : "rounded-lg"
  );

  switch (media.type) {
    case "photo": {
      const path = media.asset.path;

      const handleOpenLightbox = () => {
        openLightbox({
          images: [media.asset],
          currentIndex: 0,
        });
      };

      return (
        <LazyImage
          className={cn(
            baseMediaClass,
            "object-cover cursor-pointer hover:opacity-90 transition-opacity duration-200 will-change-auto z-[9999]"
          )}
          src={path}
          asset={media.asset}
          onClick={handleOpenLightbox}
          alt={media.description || ""}
          ratio={[media.width, media.height]}
          full
        />
      );
    }
    case "video": {
      const isLoop = (media.duration_millis ?? 0) < 600000;
      return (
        <LazyVideo
          className={cn(baseMediaClass)}
          controls
          playsInline
          muted
          autoPlay
          poster={media.thumb.path}
          asset={media.asset}
          loop={isLoop}
          ariaLabel={media.description || "Video content"}
          src={media.asset.path}
          ratio={media.aspect_ratio}
        />
      );
    }
    case "animated_gif":
      return (
        <LazyVideo
          className={cn(baseMediaClass)}
          autoPlay
          loop
          muted
          playsInline
          asset={media.asset}
          ariaLabel={media.description || "gif content"}
          src={media.asset.path}
          ratio={media.aspect_ratio}
        />
      );
    default:
      return null;
  }
};

const renderSingleMedia = (media: Media[], state: TweetState) => (
  <div className="w-full">
    <MediaElement media={media[0]} state={state} />
  </div>
);

const renderTwoMedia = (media: Media[], state: TweetState) => {
  const [m1, m2] = media;
  const bothLandscape = isLandscape(m1) && isLandscape(m2);
  const bothPortrait = !isLandscape(m1) && !isLandscape(m2);

  if (bothLandscape) {
    return (
      <div className="flex flex-col gap-2">
        <MediaElement media={m1} state={state} />
        <MediaElement media={m2} state={state} />
      </div>
    );
  }

  if (bothPortrait) {
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
        <MediaElement media={m1} state={state} />
        <MediaElement media={m2} state={state} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {isLandscape(m1) ? (
        <>
          <MediaElement media={m1} state={state} />
          <MediaElement media={m2} state={state} />
        </>
      ) : (
        <>
          <MediaElement media={m2} state={state} />
          <MediaElement media={m1} state={state} />
        </>
      )}
    </div>
  );
};

const renderThreeMedia = (media: Media[], state: TweetState) => {
  const wideCount = media.filter(isLandscape).length;
  const tallCount = 3 - wideCount;

  // 全部是横向媒体
  if (wideCount === 3) {
    return (
      <div className="flex flex-col gap-2">
        {media.map((m) => (
          <MediaElement media={m} state={state} key={m.id} />
        ))}
      </div>
    );
  }

  // 全部是纵向媒体
  if (tallCount === 3) {
    return (
      <div className="flex flex-row gap-2">
        {media.map((m, i) => (
          <MediaElement media={m} state={state} key={`${m.id}-${i}`} />
        ))}
      </div>
    );
  }

  // 2横1竖
  if (wideCount === 2 && tallCount === 1) {
    const tIndex = media.findIndex((m) => !isLandscape(m));
    const tall = media[tIndex];
    const wide = media.filter((_, i) => i !== tIndex);
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          {wide.map((m, i) => (
            <MediaElement media={m} state={state} key={`${m.id}-${i}`} />
          ))}
        </div>
        <div>
          <MediaElement media={tall} state={state} />
        </div>
      </div>
    );
  }

  // 1横2竖
  if (wideCount === 1 && tallCount === 2) {
    const wIndex = media.findIndex(isLandscape);
    const wide = media[wIndex];
    const tall = media.filter((_, i) => i !== wIndex);
    return (
      <div className="flex flex-col gap-2">
        <div>
          <MediaElement media={wide} state={state} />
        </div>
        <div className="flex flex-row gap-2">
          {tall.map((m, i) => (
            <div key={m.id} className="flex-1 min-w-0">
              <MediaElement key={`${m.id}-${i}`} media={m} state={state} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return renderDefaultGrid(media, state);
};

const renderFourMedia = (media: Media[], state: TweetState) => {
  const layout = calcLayout(media);
  return (
    <div className="flex gap-2">
      <div className="flex flex-col gap-2 flex-1">
        {layout[0].map((i) => (
          <MediaElement
            media={media[i]}
            state={state}
            key={`${media[i].id}-${i}`}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {layout[1].map((i) => (
          <MediaElement
            media={media[i]}
            state={state}
            key={`${media[i].id}-${i}`}
          />
        ))}
      </div>
    </div>
  );
};

const renderDefaultGrid = (media: Media[], state: TweetState) => (
  <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
    {media.map((m, i) => (
      <div key={`${m.id}-${i}`} className="w-full h-auto">
        <MediaElement media={m} state={state} />
      </div>
    ))}
  </div>
);

interface MediaGridProps {
  state: TweetState;
  medias?: Media[] | null;
}

export default function MediaGrid({ state, medias }: MediaGridProps) {
  if (!medias?.length) return null;

  const renderStrategies: Record<
    number,
    (media: Media[], state: TweetState) => JSX.Element
  > = {
    1: renderSingleMedia,
    2: renderTwoMedia,
    3: renderThreeMedia,
    4: renderFourMedia,
  };

  const renderStrategy = renderStrategies[medias.length] || renderDefaultGrid;

  return renderStrategy(medias, state);
}
