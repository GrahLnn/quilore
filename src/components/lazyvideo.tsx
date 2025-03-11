import type React from "react";
import { useEffect, useRef, useState } from "react";
import useElementInView from "../hooks/view";
import { clearVideo } from "../utils/media";

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
  const offset = 500;
  const [w, h] = ratio;
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const inView = useElementInView(containerRef, offset);

  // 当 inView 为 true 且 videoRef 挂载时，保存 videoEl
  useEffect(() => {
    if (inView && videoRef.current) {
      setVideoEl(videoRef.current);
    }
  }, [inView]);

  // 当 inView 为 false 时，用 videoEl 调用 clearVideo，并重置 videoEl
  useEffect(() => {
    if (!inView && videoEl) clearVideo(videoEl);
  }, [inView, videoEl]);

  // 组件卸载时，用 videoEl 清理视频
  useEffect(() => {
    return () => {
      if (videoEl) clearVideo(videoEl);
    };
  }, [videoEl]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", aspectRatio: `${w} / ${h}` }}
    >
      {inView && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          preload="none"
          {...props}
        />
      )}
    </div>
  );
};

export default LazyVideo;
