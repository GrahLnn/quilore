import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { clearVideo } from "../utils/video";

interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  ratio: [number, number];
}

const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  poster,
  ratio,
  ...props
}) => {
  const offset = 1000;
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: `${offset}px`,
  });
  const [w, h] = ratio;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    setVideoEl(videoRef.current);
  }, []);

  useEffect(() => {
    if (videoEl && !inView) {
      clearVideo(videoEl);
    }
  }, [inView, videoEl]);

  return (
    <div ref={ref}>
      {inView ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          preload="none"
          {...props}
        />
      ) : (
        <div style={{ width: "100%", aspectRatio: `${w} / ${h}` }} />
      )}
    </div>
  );
};

export default LazyVideo;
