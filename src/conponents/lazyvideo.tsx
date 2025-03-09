import type React from "react";
import { memo, useEffect, useRef } from "react";
import LazyLoad from "react-lazyload";

interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  ratio: [number, number];
  offset?: number | number[];
}

const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  poster,
  ratio,
  offset = 300,
  ...props
}) => {
  const [w, h] = ratio;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 用于清理 video 元素（卸载时停止播放、重置、释放资源）
  useEffect(() => {
    // 在挂载时保存 video 的引用
    const videoEl = videoRef.current;

    return () => {
      // 此处 videoEl 不会被 React 重置为 null
      if (videoEl) {
        // 停止播放
        videoEl.pause();
        // 重置播放时间
        videoEl.currentTime = 0;
        // 解除 source
        videoEl.removeAttribute("src");
        videoEl.src = "";
        // 清除媒体流对象
        if ("srcObject" in videoEl) {
          videoEl.srcObject = null;
        }
        // 移除所有事件监听器
        videoEl.oncanplay = null;
        videoEl.onplay = null;
        videoEl.onpause = null;
        videoEl.onended = null;
        videoEl.onerror = null;
        videoEl.onloadeddata = null;
        videoEl.onloadedmetadata = null;
        // 强制浏览器丢弃已解码的缓存
        videoEl.load();
      }
    };
  }, []);

  const style = {
    width: "100%",
    aspectRatio: `${w} / ${h}`,
  };

  return (
    <div ref={containerRef}>
      <LazyLoad
        unmountIfInvisible
        offset={offset}
        placeholder={<div style={style} />}
        style={style}
      >
        <video ref={videoRef} src={src} poster={poster} {...props} />
      </LazyLoad>
    </div>
  );
};

export default LazyVideo;
