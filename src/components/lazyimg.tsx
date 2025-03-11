import type React from "react";
import { useEffect, useRef, useState } from "react";
import useElementInView from "../hooks/view";
import { clearImg } from "../utils/media";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  ratio: [number, number];
}

const LazyImage: React.FC<LazyImageProps> = ({ src, ratio, ...props }) => {
  const offset = 1000;
  const [w, h] = ratio;
  const containerRef = useRef<HTMLImageElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const inView = useElementInView(containerRef, offset);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);

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
      {inView && (
        // biome-ignore lint/a11y/useAltText: <explanation>
        <img ref={imgRef} src={src} {...props} />
      )}
    </div>
  );
};

export default LazyImage;
