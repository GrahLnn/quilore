import type React from "react";
import { useEffect, useRef, useState } from "react";
import useElementInView from "../hooks/view";
import { clearImg } from "../utils/media";
import { Asset } from "../cmd/commands";
import { useAssetState } from "../subpub/assetsState";
import { convertFileSrc } from "@tauri-apps/api/core";
import { crab } from "../cmd/commandAdapter";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { sizeMap } from "../subpub/buses";
import { createPortal } from "react-dom";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  asset: Asset;
  ratio?: [number, number];
  full?: boolean;
  holderCn?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  asset,
  ratio,
  className,
  alt,
  full,
  holderCn,
  onClick,
}) => {
  const offset = 1000;
  // 先从 sizeMap 中查找，如果没有则使用传入的 ratio
  const [storedRatio, setStoredRatio] = useState<[number, number] | undefined>(
    undefined
  );
  const [w, h] = ratio || [1, 1];
  const containerRef = useRef<HTMLImageElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const inView = useElementInView(containerRef, offset);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);

  const [exists, setExists] = useState(false);

  const assetState = useAssetState();
  const val = assetState.get(asset.name);

  const [isCleared, setClear] = useState(false);

  const [expand, setExpand] = useState(false);

  // 当 val 变化且不是 undefined 时触发重绘
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

  useEffect(() => {
    if (inView && imgRef.current) {
      setImgEl(imgRef.current);
      if (inView && containerRef.current) {
        setStoredRatio([
          containerRef.current.clientWidth,
          containerRef.current.clientHeight,
        ]);
      }
    }
  }, [inView]);

  useEffect(() => {
    if (imgEl && !inView) {
      clearImg(imgEl);
      setClear(true);
    }
    return () => {
      if (imgEl && !inView) clearImg(imgEl);
    };
  }, [inView, imgEl]);

  return (
    <motion.div
      ref={containerRef}
      className="transform-gpu"
      style={{
        width: full ? "100%" : undefined,
        aspectRatio: `${w} / ${h}`,
        height: storedRatio && `${storedRatio[1]}px`,
      }}
      // layout
    >
      {inView && exists ? (
        <motion.img
          ref={imgRef}
          src={convertFileSrc(src)}
          onClick={onClick}
          className={className}
          alt={alt}
          layoutId={asset.name}
        />
      ) : (
        <div
          className={cn(
            "relative w-full h-full rounded-md overflow-hidden",
            "bg-[linear-gradient(120deg,#f5f5f5,#d4d4d4,#ffffff)]",
            "dark:bg-[linear-gradient(120deg,#000000,#1a1a1a,#000000)]",
            "bg-[length:500%_500%]",
            "animate-[bgmove_6s_ease-in-out_infinite]",
            holderCn
          )}
        />
      )}
    </motion.div>
  );
};

export default LazyImage;
