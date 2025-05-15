import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import useElementInView from "../hooks/view";
import { clearImg } from "../utils/media";
import { Asset } from "../cmd/commands";
import { convertFileSrc } from "@tauri-apps/api/core";
import { crab } from "../cmd/commandAdapter";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { createPortal } from "react-dom";
import { LightboxPayload } from "./modalbox/lightbox";
import { newBundimgMachine } from "../state_machine/bundimg";
import { station } from "../subpub/buses";
import { Lightbox } from "./modalbox/lightbox";
import { newModalMachine } from "../state_machine/modalbox.sm";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  asset: Asset;
  ratio?: [number, number];
  full?: boolean;
  holderCn?: string;
  allowbox?: boolean;
}
type RectLite = {
  width: number;
  height: number;
  top: number;
  left: number;
};

const LazyImage: React.FC<LazyImageProps> = memo(
  function LazyImageComp({
    allowbox = false,
    asset,
    ratio,
    className,
    alt,
    full,
    holderCn,
    onClick,
  }: LazyImageProps) {
    const [exists, setExists] = useState(false);
    const [rect, setRect] = useState<RectLite | null>(null);
    const [animationInstanceHash] = useState(() =>
      Math.random().toString(36).substring(2, 10)
    );
    const [stateM] = useState(() =>
      newModalMachine<LightboxPayload>("lightbox")
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const imgmRef =
      useRef<ReturnType<typeof newBundimgMachine>>(newBundimgMachine());
    const inView = useElementInView(containerRef, 4000);
    const assetState = station.assetState.useSee();
    const boxState = stateM.useModalState();
    const val = assetState.get(asset.name);
    const imgm = imgmRef.current!;
    const bundimgCurrentState = imgm.useBundimgState();
    const isGhostCurrently = useMemo(
      () => bundimgCurrentState.is("ghost"),
      [bundimgCurrentState]
    );
    const assetSrc = useMemo(() => convertFileSrc(asset.path), [asset.path]);

    const isCurImg = useCallback(() => {
      return (
        boxState.payload?.images[boxState.payload?.currentIndex].asset.name ===
          asset.name &&
        boxState.payload?.images[boxState.payload?.currentIndex].hash ===
          animationInstanceHash
      );
    }, [boxState.payload, asset.name, animationInstanceHash]);

    // useEffect(() => {
    //   if (inView && exists) {
    //     imgm.toNormal();
    //     if (imgRef.current) {
    //       imgRef.current.src = assetSrc;
    //     }
    //   } else {
    //     imgm.toHolder();
    //     if (imgRef.current) {
    //       clearImg(imgRef.current);
    //     }
    //   }
    // }, [inView, exists]);
    useEffect(() => {
      if (inView && exists) {
        imgm.toNormal();

        const img = imgRef.current;
        if (img) {
          const scheduleDecode = () => {
            img.src = assetSrc;

            if ("decode" in img) {
              img.decode().catch(() => {});
            }
          };

          if ("requestIdleCallback" in window) {
            requestIdleCallback(scheduleDecode);
          } else {
            // fallback: setTimeout
            setTimeout(scheduleDecode, 50);
          }
        }
      } else {
        imgm.toHolder();
        if (imgRef.current) {
          clearImg(imgRef.current);
        }
      }
    }, [inView, exists, assetSrc]);

    useEffect(() => {
      if (val) setExists(val);
    }, [val]);

    useEffect(() => {
      crab.exists(asset.path).then((r) => r.tap(setExists));
    }, []);

    useEffect(() => {
      if (boxState.isClosed && isCurImg()) imgm.toNormal();
    }, [boxState.isClosed]);

    useEffect(() => {
      const { state, data } = boxState.isExiting;
      if (state && data && isCurImg()) imgm.toGhost();
    }, [boxState.isExiting.state]);

    const handleMotionImgClick = useCallback(
      (e: React.MouseEvent<HTMLImageElement>) => {
        if (allowbox) {
          if (containerRef.current) {
            updateRect();
          }
          imgm.toGhost();
        } else {
          onClick?.(e);
        }
      },
      [allowbox, imgm, onClick]
    );
    const handleMotionImgLoad = useCallback(() => {
      updateRect();
    }, []);

    const updateRect = useCallback(() => {
      if (containerRef.current && imgRef.current) {
        const domRect = imgRef.current.getBoundingClientRect();
        const lite: RectLite = {
          width: domRect.width,
          height: domRect.height,
          top: domRect.top,
          left: domRect.left,
        };

        setRect((prev) => {
          const shouldUpdate =
            !prev ||
            prev.width !== lite.width ||
            prev.height !== lite.height ||
            prev.top !== lite.top ||
            prev.left !== lite.left;

          if (!shouldUpdate) {
            // console.log("[skip] rect unchanged", asset.name);
            return prev;
          } else {
            // console.log("[set] rect updated", asset.name, prev, "→", lite);
            return lite;
          }
        });
      }
    }, []);

    useEffect(() => {
      if (isGhostCurrently) {
        const handleUpdate = () => {
          if (isGhostCurrently) {
            updateRect();
          }
        };

        window.addEventListener("scroll", handleUpdate, true);
        window.addEventListener("resize", handleUpdate);
        handleUpdate();

        return () => {
          window.removeEventListener("scroll", handleUpdate, true);
          window.removeEventListener("resize", handleUpdate);
        };
      }
    }, [isGhostCurrently, updateRect]);

    const renderImage = useMemo(() => {
      return bundimgCurrentState.match({
        normal: () => (
          <motion.img
            ref={imgRef}
            src={assetSrc}
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
                src={assetSrc}
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
                  stateM.open({
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
      });
    }, [bundimgCurrentState]);

    return (
      <>
        <motion.div
          ref={containerRef}
          style={{
            width: full ? "100%" : undefined,
            aspectRatio: `${ratio?.[0] || 1} / ${ratio?.[1] || 1}`,
            height: rect ? `${rect.height}px` : undefined,
          }}
        >
          {renderImage}
        </motion.div>
        <Lightbox lightboxMachine={stateM} />
      </>
    );
  },
  (prev, next) => {
    return (
      prev.asset.name === next.asset.name && prev.allowbox === next.allowbox
    );
  }
);

export default LazyImage;
