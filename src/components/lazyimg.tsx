import type React from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import useElementInView from "../hooks/view";
import { clearImg } from "../utils/media";
import { Asset } from "../cmd/commands";
import { useAssetState } from "../subpub/assetsState";
import { convertFileSrc } from "@tauri-apps/api/core";
import { crab } from "../cmd/commandAdapter";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { createPortal } from "react-dom";
import { lightboxMachine, openLightbox } from "./modalbox/lightbox";
import { newBundimgMachine } from "../state_machine/bundimg";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  asset: Asset;
  ratio?: [number, number];
  full?: boolean;
  holderCn?: string;
  allowbox?: boolean;
}

interface BoxPayload {
  images: Asset[];
  currentIndex: number;
}

const LazyImage: React.FC<LazyImageProps> = memo(
  ({
    allowbox = false,
    asset,
    ratio,
    className,
    alt,
    full,
    holderCn,
    onClick,
  }) => {
    const offset = 1000;
    const [exists, setExists] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [animationInstanceHash] = useState(() =>
      Math.random().toString(36).substring(2, 10)
    );
    const containerRef = useRef<HTMLImageElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const imgmRef = useRef<ReturnType<typeof newBundimgMachine>>(
      newBundimgMachine()
    );

    const inView = useElementInView(containerRef, offset);
    const assetState = useAssetState();
    const boxState = lightboxMachine.useModalState();
    const val = assetState.get(asset.name);
    const imgm = imgmRef.current!;

    // [TODO] 更精细的状态控制避免无关image的重绘，和box state有关

    useEffect(() => {
      if (inView && exists) {
        imgm.toNormal();
        imgRef.current && (imgRef.current.src = convertFileSrc(asset.path));
      } else {
        imgm.toHolder();
        imgRef.current && clearImg(imgRef.current);
      }
    }, [inView, exists]);

    useEffect(() => {
      if (val) setExists(val);
    }, [val]);

    useEffect(() => {
      crab.exists(asset.path).then((r) => r.tap(setExists));
    }, []);

    useEffect(() => {
      if (boxState.isClosed) imgm.toNormal();
    }, [boxState.isClosed]);

    useEffect(() => {
      const { state, data } = boxState.isExiting;
      if (state && asset.name === data?.images[data.currentIndex].asset.name)
        imgm.toGhost();
    }, [boxState.isExiting.state]);

    const handleMotionImgClick = useCallback(
      (e: React.MouseEvent<HTMLImageElement>) => {
        if (allowbox) {
          if (containerRef.current) {
            setRect(containerRef.current.getBoundingClientRect());
          }
          imgm.toGhost();
        } else {
          onClick?.(e);
        }
      },
      [allowbox, imgm, onClick]
    );
    const handleMotionImgLoad = useCallback(() => {
      if (containerRef.current) {
        const currentRect = containerRef.current.getBoundingClientRect();
        // 优化：只有当 rect 真的改变时才更新，避免不必要的 setRect 调用
        // (直接比较对象总是 false，需要比较属性)
        setRect((prevRect) => {
          if (
            !prevRect ||
            currentRect.width !== prevRect.width ||
            currentRect.height !== prevRect.height ||
            currentRect.top !== prevRect.top ||
            currentRect.left !== prevRect.left
          ) {
            return currentRect;
          }
          return prevRect; // 如果没变，返回旧的 rect，避免不必要的重渲染
        });
      }
    }, []);

    return (
      <motion.div
        ref={containerRef}
        style={{
          width: full ? "100%" : undefined,
          aspectRatio: `${ratio?.[0] || 1} / ${ratio?.[1] || 1}`,
          height: rect ? `${rect.height}px` : undefined,
        }}
      >
        {imgm.useBundimgState().match({
          normal: () => (
            <motion.img
              ref={imgRef}
              src={convertFileSrc(asset.path)}
              onClick={handleMotionImgClick}
              className={className}
              alt={alt}
              onLoad={handleMotionImgLoad}
            />
          ),
          ghost: () => {
            return createPortal(
              rect && (
                <motion.img
                  id="ghost"
                  src={convertFileSrc(asset.path)}
                  style={{
                    position: "absolute",
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height,
                    pointerEvents: "none",
                    zIndex: 60,
                  }}
                  layoutId={asset.name + animationInstanceHash}
                  className={className}
                  onLoad={() => {
                    if (boxState.isExiting.state) return;
                    openLightbox({
                      images: [
                        {
                          asset,
                          hash: animationInstanceHash,
                        },
                      ],
                      currentIndex: 0,
                    });
                    imgm.toNone();
                  }}
                />
              ),
              document.body
            );
          },
          holder: () => (
            <div
              className={cn(
                "relative w-full rounded-md overflow-hidden",
                "bg-[linear-gradient(120deg,#f5f5f5,#d4d4d4,#ffffff)]",
                "dark:bg-[linear-gradient(120deg,#000,#1a1a1a,#000)]",
                "bg-[length:500%_500%]",
                "animate-[bgmove_6s_ease-in-out_infinite]",
                holderCn
              )}
              style={{
                height: rect ? `${rect.height}px` : undefined,
              }}
            />
          ),
          none: () => null,
        })}
      </motion.div>
    );
  }
);

export default LazyImage;
