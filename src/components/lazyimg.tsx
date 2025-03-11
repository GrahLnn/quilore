import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  ratio: [number, number];
}

const LazyImage: React.FC<LazyImageProps> = ({ src, ratio, ...props }) => {
  const offset = 1000;
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: `${offset}px`,
  });
  const [w, h] = ratio;
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    setImgEl(imgRef.current);
  }, []);

  useEffect(() => {
    if (imgEl && !inView) {
      imgEl.src = "";
    }
  }, [inView, imgEl]);

  return (
    <div ref={ref}>
      {inView ? (
        // biome-ignore lint/a11y/useAltText: <explanation>
        <img ref={imgRef} src={src} {...props} />
      ) : (
        <div style={{ width: "100%", aspectRatio: `${w} / ${h}` }} />
      )}
    </div>
  );
};

export default LazyImage;
