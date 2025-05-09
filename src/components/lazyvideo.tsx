import type React from "react";
import { useEffect, useReducer, useRef, useState } from "react";
import useElementInView from "../hooks/view";
import { clearVideo } from "../utils/media";
import { useAssetState } from "../subpub/assetsState";
import { Asset } from "../cmd/commands";
import { crab } from "../cmd/commandAdapter";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { convertFileSrc } from "@tauri-apps/api/core";

interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  asset: Asset;
  ratio: [number, number];
  ariaLabel?: string;
}

const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  poster,
  asset,
  ratio,
  className,
  ariaLabel,
  autoPlay,
  loop,
  muted,
  controls,
}) => {
  const offset = 500;
  const [w, h] = ratio;
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const inView = useElementInView(containerRef, offset);
  const [exists, setExists] = useState(false);
  const assetState = useAssetState();
  const val = assetState.get(asset.name);
  const [storedRatio, setStoredRatio] = useState<[number, number] | undefined>(
    undefined
  );

  useEffect(() => {
    if (val) {
      setExists(val);
    }
  }, [val]);

  useEffect(() => {
    (async () => {
      const exists = await crab.exists(asset.path);
      exists.tap(setExists);
    })();
  }, []);

  // 当 inView 为 true 且 videoRef 挂载时，保存 videoEl
  useEffect(() => {
    if (inView && videoRef.current) {
      setVideoEl(videoRef.current);
      if (inView && containerRef.current) {
        setStoredRatio([
          containerRef.current.clientWidth,
          containerRef.current.clientHeight,
        ]);
      }
    }
  }, [inView]);

  // 当 inView 为 false 时，用 videoEl 调用 clearVideo，并重置 videoEl
  useEffect(() => {
    if (!inView && videoEl) clearVideo(videoEl);
    return () => {
      if (!inView && videoEl) clearVideo(videoEl);
    };
  }, [inView, videoEl]);

  return (
    <div
      ref={containerRef}
      className="transform-gpu"
      style={{
        width: "100%",
        aspectRatio: `${w} / ${h}`,
        height: storedRatio && `${storedRatio[1]}px`,
      }}
    >
      {inView && exists ? (
        <motion.video
          ref={videoRef}
          src={convertFileSrc(src)}
          poster={poster ? convertFileSrc(poster) : undefined}
          preload="none"
          // initial={{ filter: "blur(24px)" }}
          // animate={{
          //   filter: "blur(0px)",
          // }}
          // transition={{
          //   filter: { type: "spring", visualDuration: 0.3 },
          // }}
          // {...props}
          className={className}
          aria-label={ariaLabel}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          controls={controls}
          playsInline
        />
      ) : (
        <div
          className={cn(
            "relative w-full h-full rounded-md overflow-hidden",
            "bg-[linear-gradient(120deg,#f5f5f5,#d4d4d4,#ffffff)]",
            "dark:bg-[linear-gradient(120deg,#000000,#1a1a1a,#000000)]",
            "bg-[length:500%_500%]",
            "animate-[bgmove_6s_ease-in-out_infinite]"
          )}
        />
      )}
    </div>
  );
};

export default LazyVideo;
