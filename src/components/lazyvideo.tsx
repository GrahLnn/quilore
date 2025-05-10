import { convertFileSrc } from "@tauri-apps/api/core";
import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  useState,
  useEffect,
  MouseEvent,
} from "react";
import useElementInView from "../hooks/view";
import { clearVideo } from "../utils/media";
import { useAssetState } from "../subpub/assetsState";
import { Asset } from "../cmd/commands";
import { crab } from "../cmd/commandAdapter";
import { cn } from "@/lib/utils";

const formatTime = (t: number): string => {
  const m = Math.floor(t / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  asset: Asset;
  ratio: [number, number];
  ariaLabel?: string;
}

interface TheVideoProps {
  src: string;
  muted?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  className?: string;
  poster?: string;
}

const TheVideo = forwardRef<HTMLVideoElement, TheVideoProps>(
  (
    {
      src,
      muted: initialMuted = false,
      autoPlay = false,
      loop = false,
      controls = false,
      className,
      poster,
    },
    externalRef
  ) => {
    const innerRef = useRef<HTMLVideoElement>(null);

    // 把内部 ref 暴露给父组件
    useImperativeHandle(externalRef, () => innerRef.current!, []);

    const [paused, setPaused] = useState<boolean>(!autoPlay);
    const [muted, setMuted] = useState<boolean>(initialMuted);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [bufferedEnd, setBufferedEnd] = useState<number>(0);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [showControls, setShowControls] = useState<boolean>(controls);

    // 播放 / 暂停
    const togglePlay = () => {
      const v = innerRef.current;
      if (!v) return;
      if (v.paused) v.play();
      else v.pause();
    };

    // 静音 / 取消静音
    const toggleMute = () => {
      const v = innerRef.current;
      if (!v) return;
      v.muted = !v.muted;
      setMuted(v.muted);
    };

    // 初始化视频属性和事件监听
    useEffect(() => {
      const v = innerRef.current;
      if (!v) return;

      // 设置初始属性（通过方法而非属性）
      if (initialMuted) v.muted = true;

      // 监听视频结束事件，实现循环播放
      const handleEnded = () => {
        if (loop && v) {
          v.currentTime = 0;
          v.play().catch(() => {
            setPaused(true);
          });
        }
      };

      v.addEventListener("ended", handleEnded);

      // 如果设置了自动播放，尝试播放
      if (autoPlay) {
        v.play().catch(() => {
          // 自动播放失败时（通常是浏览器策略限制），设置为暂停状态
          setPaused(true);
        });
      }

      return () => {
        v.removeEventListener("ended", handleEnded);
      };
    }, [autoPlay, loop, initialMuted]);

    // 同步 video 事件到 state
    useEffect(() => {
      const v = innerRef.current;
      if (!v) return;

      const onTimeUpdate = () => setCurrentTime(v.currentTime);
      const onDurationChange = () => setDuration(v.duration);
      const onProgress = () => {
        const buf = v.buffered;
        if (buf.length) {
          setBufferedEnd(buf.end(buf.length - 1));
        }
      };
      const onPlayPause = () => setPaused(v.paused);
      const onVolumeChange = () => setMuted(v.muted);

      v.addEventListener("timeupdate", onTimeUpdate);
      v.addEventListener("durationchange", onDurationChange);
      v.addEventListener("progress", onProgress);
      v.addEventListener("play", onPlayPause);
      v.addEventListener("pause", onPlayPause);
      v.addEventListener("volumechange", onVolumeChange);

      return () => {
        v.removeEventListener("timeupdate", onTimeUpdate);
        v.removeEventListener("durationchange", onDurationChange);
        v.removeEventListener("progress", onProgress);
        v.removeEventListener("play", onPlayPause);
        v.removeEventListener("pause", onPlayPause);
        v.removeEventListener("volumechange", onVolumeChange);
      };
    }, []);

    // 点击进度条跳转
    const onSeek = (e: MouseEvent<HTMLDivElement>) => {
      const v = innerRef.current;
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const pct = Math.min(
        Math.max((e.clientX - rect.left) / rect.width, 0),
        1
      );
      if (v && duration > 0) {
        v.currentTime = pct * duration;
      }
    };

    // hover 计算预览时间
    const onHover = (e: MouseEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const pct = Math.min(
        Math.max((e.clientX - rect.left) / rect.width, 0),
        1
      );
      setHoverTime(pct * duration);
    };

    return (
      <div className="vc-wrapper">
        <video
          ref={innerRef}
          className={cn("vc-video", className)}
          src={convertFileSrc(src)}
          poster={poster ? convertFileSrc(poster) : undefined}
          crossOrigin="anonymous"
        />

        {!controls ? (
          <>
            <button className="vc-play-btn" onClick={togglePlay}>
              {paused ? "▶️" : "⏸️"}
            </button>

            <div className="vc-controls">
              <button className="vc-mute-btn" onClick={toggleMute}>
                {muted ? "🔇" : "🔊"}
              </button>
              <div
                className="vc-range"
                onClick={onSeek}
                onMouseMove={onHover}
                onMouseLeave={() => setHoverTime(null)}
              >
                <div
                  className="vc-buffered"
                  style={{
                    width: `${
                      duration > 0 ? (bufferedEnd / duration) * 100 : 0
                    }%`,
                  }}
                />
                <div
                  className="vc-played"
                  style={{
                    width: `${
                      duration > 0 ? (currentTime / duration) * 100 : 0
                    }%`,
                  }}
                />
                {hoverTime !== null && (
                  <div
                    className="vc-preview-time"
                    style={{ left: `${(hoverTime / duration) * 100}%` }}
                  >
                    {formatTime(hoverTime)}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="vc-native-controls">
            <button className="vc-play-btn" onClick={togglePlay}>
              {paused ? "▶️" : "⏸️"}
            </button>
            <button className="vc-mute-btn" onClick={toggleMute}>
              {muted ? "🔇" : "🔊"}
            </button>
            <div
              className="vc-range"
              onClick={onSeek}
              onMouseMove={onHover}
              onMouseLeave={() => setHoverTime(null)}
            >
              <div
                className="vc-buffered"
                style={{
                  width: `${
                    duration > 0 ? (bufferedEnd / duration) * 100 : 0
                  }%`,
                }}
              />
              <div
                className="vc-played"
                style={{
                  width: `${
                    duration > 0 ? (currentTime / duration) * 100 : 0
                  }%`,
                }}
              />
              {hoverTime !== null && (
                <div
                  className="vc-preview-time"
                  style={{ left: `${(hoverTime / duration) * 100}%` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
            </div>
          </div>
        )}

        <style>{`
          .vc-wrapper {
            position: relative;
            width: 100%;
            font-size: 16px;
            color: #fff;
            background: #000;
          }
          .vc-video {
            width: 100%;
            display: block;
          }
          .vc-play-btn {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(38, 38, 38, 0.75);
            border: none;
            border-radius: 50%;
            padding: 0.7em;
            font-size: 1.5em;
            color: #fff;
            cursor: pointer;
          }
          .vc-controls, .vc-native-controls {
            position: absolute;
            bottom: 0.5em;
            left: 0;
            right: 0;
            display: flex;
            align-items: center;
            padding: 0 0.8em;
            background: rgba(0, 0, 0, 0.5);
          }
          .vc-native-controls {
            padding: 0.8em;
          }
          .vc-mute-btn {
            background: rgba(38, 38, 38, 0.75);
            border: none;
            border-radius: 50%;
            padding: 0.3em;
            font-size: 1.2em;
            color: #fff;
            cursor: pointer;
          }
          .vc-range {
            position: relative;
            flex: 1;
            height: 4px;
            margin: 0 0.8em;
            background: rgba(38, 38, 38, 0.25);
            cursor: pointer;
          }
          .vc-buffered {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: rgba(38, 38, 38, 0.3);
          }
          .vc-played {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: #fff;
          }
          .vc-preview-time {
            position: absolute;
            top: -1.6em;
            transform: translateX(-50%);
            background: rgba(38, 38, 38, 0.75);
            padding: 0.2em 0.4em;
            border-radius: 4px;
            font-size: 0.8em;
          }
        `}</style>
      </div>
    );
  }
);

TheVideo.displayName = "TheVideo";

const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  poster,
  asset,
  ratio,
  className,
  ariaLabel,
  autoPlay,
  loop,
  muted,
  controls,
}) => {
  const offset = 500;
  const [w, h] = ratio;
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const inView = useElementInView(containerRef, offset);
  const [exists, setExists] = useState(false);
  const assetState = useAssetState();
  const val = assetState.get(asset.name);
  const [storedRatio, setStoredRatio] = useState<[number, number] | undefined>(
    undefined
  );

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

  // 当 inView 为 true 且 videoRef 挂载时，保存 videoEl
  useEffect(() => {
    if (inView && videoRef.current) {
      setVideoEl(videoRef.current);
      if (inView && containerRef.current) {
        setStoredRatio([
          containerRef.current.clientWidth,
          containerRef.current.clientHeight,
        ]);
      }
    }
  }, [inView]);

  // 当 inView 为 false 时，用 videoEl 调用 clearVideo，并重置 videoEl
  useEffect(() => {
    if (!inView && videoEl) clearVideo(videoEl);
    return () => {
      if (!inView && videoEl) clearVideo(videoEl);
    };
  }, [inView, videoEl]);

  return (
    <div
      ref={containerRef}
      className="transform-gpu"
      style={{
        width: "100%",
        aspectRatio: `${w} / ${h}`,
        height: storedRatio && `${storedRatio[1]}px`,
      }}
    >
      {inView && exists ? (
        <TheVideo
          ref={videoRef}
          src={src}
          poster={poster}
          controls={controls}
          muted={muted}
          autoPlay={autoPlay}
          loop={loop}
          className={className}
          aria-label={ariaLabel}
        />
      ) : (
        <div
          className={cn(
            "relative w-full h-full rounded-md overflow-hidden",
            "bg-[linear-gradient(120deg,#f5f5f5,#d4d4d4,#ffffff)]",
            "dark:bg-[linear-gradient(120deg,#000000,#1a1a1a,#000000)]",
            "bg-[length:500%_500%]",
            "animate-[bgmove_6s_ease-in-out_infinite]"
          )}
        />
      )}
    </div>
  );
};

export default LazyVideo;
