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
  const [w, h] = ratio || [1, 1];
  const containerRef = useRef<HTMLImageElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const inView = useElementInView(containerRef, offset);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);

  const [exists, setExists] = useState(false);

  const assetState = useAssetState();
  const val = assetState.get(asset.name);

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
    }
  }, [inView]);

  useEffect(() => {
    if (imgEl && !inView) clearImg(imgEl);
    return () => {
      if (imgEl && !inView) clearImg(imgEl);
    };
  }, [inView, imgEl]);

  return (
    <div
      ref={containerRef}
      style={{ width: full ? "100%" : undefined, aspectRatio: `${w} / ${h}` }}
    >
      {inView && exists ? (
        // biome-ignore lint/a11y/useAltText: <explanation>
        <motion.img
          ref={imgRef}
          src={convertFileSrc(src)}
          // initial={{ filter: "blur(24px)" }}
          // animate={{
          //   filter: "blur(0px)",
          // }}
          // transition={{
          //   filter: { type: "spring", visualDuration: 0.3 },
          // }}
          onClick={onClick}
          className={className}
          alt={alt}
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
    </div>
  );
};

export default LazyImage;
// import type React from "react";
// import { useEffect, useRef, useState } from "react";
// import useElementInView from "../hooks/view";
// import { clearImg } from "../utils/media";
// import { Asset } from "../cmd/commands";
// import { useAssetState } from "../subpub/assetsState";
// import { convertFileSrc } from "@tauri-apps/api/core";
// import { crab } from "../cmd/commandAdapter";
// import { cn } from "@/lib/utils";
// import { motion } from "motion/react";

// interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
//   src: string;
//   asset: Asset;
//   ratio?: [number, number];
//   full?: boolean;
//   holderCn?: string;
// }

// const LazyImage: React.FC<LazyImageProps> = ({
//   src,
//   asset,
//   ratio,
//   className,
//   alt,
//   full,
//   holderCn,
// }) => {
//   const offset = 1000;
//   const [w, h] = ratio || [1, 1];
//   const containerRef = useRef<HTMLImageElement>(null);
//   const imgRef = useRef<HTMLImageElement>(null);
//   const inView = useElementInView(containerRef, offset);
//   const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);

//   const [exists, setExists] = useState(false);

//   const assetState = useAssetState();
//   const val = assetState.get(asset.name);

//   // 当 val 变化且不是 undefined 时触发重绘
//   useEffect(() => {
//     if (val) {
//       setExists(val);
//     }
//   }, [val]);

//   useEffect(() => {
//     (async () => {
//       const exists = await crab.exists(asset.path);
//       exists.tap(setExists);
//     })();
//   }, []);

//   useEffect(() => {
//     if (inView && imgRef.current) {
//       setImgEl(imgRef.current);
//     }
//   }, [inView]);

//   useEffect(() => {
//     if (imgEl && !inView) clearImg(imgEl);
//     return () => {
//       if (imgEl && !inView) clearImg(imgEl);
//     };
//   }, [inView, imgEl]);
//   const [isOpen, setOpen] = useState(false);
//   const [toMax, setToMax] = useState(false);
//   const [zoomable, setZoomable] = useState(false);
//   return (
//     <div
//       ref={containerRef}
//       style={{ width: full ? "100%" : undefined, aspectRatio: `${w} / ${h}` }}
//     >
//       {inView && exists ? (
//         // biome-ignore lint/a11y/useAltText: <explanation>
//         <motion.img
//           ref={imgRef}
//           src={convertFileSrc(src)}
//           initial={{ filter: "blur(24px)" }}
//           animate={{
//             filter: "blur(0px)",
//           }}
//           transition={{
//             filter: { type: "spring", visualDuration: 0.3 },
//           }}
//           onClick={() => setOpen(!isOpen)}
//           className={cn([
//             "z-[9999]",
//             isOpen ? "fixed top-0 left-0 m-auto" : className,
//           ])}
//           alt={alt}
//           layout
//           style={{
//             maxWidth: isOpen && zoomable && toMax ? "98%" : "90%",
//             maxHeight: isOpen && zoomable && toMax ? "none" : "90%",
//           }}
//           onLoad={(e) => {
//             const img = e.currentTarget;
//             img.naturalHeight > img.height &&
//             img.naturalHeight / img.naturalWidth > 0.5
//               ? setZoomable(true)
//               : setZoomable(false);
//           }}
//         />
//       ) : (
//         <div
//           className={cn(
//             "relative w-full h-full rounded-md overflow-hidden",
//             "bg-[linear-gradient(120deg,#f5f5f5,#d4d4d4,#ffffff)]",
//             "dark:bg-[linear-gradient(120deg,#000000,#1a1a1a,#000000)]",
//             "bg-[length:500%_500%]",
//             "animate-[bgmove_6s_ease-in-out_infinite]",
//             holderCn
//           )}
//         />
//       )}
//     </div>
//   );
// };

// export default LazyImage;
