import type React from "react";
import { useEffect, useReducer, useRef, useState } from "react";
import useElementInView from "../hooks/view";
import { clearImg } from "../utils/media";
import { Asset } from "../cmd/commands";
import { useAssetState } from "../subpub/assetsState";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  asset: Asset;
  ratio: [number, number];
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  asset,
  ratio,
  ...props
}) => {
  const offset = 1000;
  const [w, h] = ratio;
  const containerRef = useRef<HTMLImageElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const inView = useElementInView(containerRef, offset);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [key, forceUpdate] = useReducer((x) => x + 1, 0);

  const assetState = useAssetState();
  const val = assetState.get(asset.name);

  // 当 val 变化且不是 undefined 时触发重绘
  useEffect(() => {
    if (val) {
      console.log("val changed", val);
      forceUpdate();
    }
  }, [val]);

  const ready = inView;
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
      style={{ width: "100%", aspectRatio: `${w} / ${h}` }}
    >
      {ready && (
        // biome-ignore lint/a11y/useAltText: <explanation>
        <img key={key} ref={imgRef} src={src} {...props} />
      )}
    </div>
  );
};

export default LazyImage;
