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
import { icons } from "../assets/icons";
import { motion, AnimatePresence } from "motion/react";
import { useOSName } from "../subpub/whichos";
import { Window } from "@tauri-apps/api/window";

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
    const containerRef = useRef<HTMLDivElement>(null);
    const os = useOSName();

    // 把内部 ref 暴露给父组件
    useImperativeHandle(externalRef, () => innerRef.current!, []);

    const [paused, setPaused] = useState<boolean>(!autoPlay);
    const [muted, setMuted] = useState<boolean>(initialMuted);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [bufferedEnd, setBufferedEnd] = useState<number>(0);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [firstClick, setFirstClick] = useState<boolean>(true);
    const [isHovering, setIsHovering] = useState<boolean>(false);

    // 处理鼠标进入和离开
    const handleMouseEnter = () => {
      setIsHovering(true);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    // 处理视频区域点击
    const handleVideoClick = () => {
      const v = innerRef.current;
      if (!v) return;

      if (firstClick && muted) {
        // 第一次点击：解除静音
        v.muted = false;
        setMuted(false);
        setFirstClick(false);

        // 如果视频是暂停状态，同时开始播放
        if (v.paused) {
          v.play().catch(() => {
            setPaused(true);
          });
        }
      } else {
        // 后续点击：切换播放/暂停状态
        togglePlay();
      }
    };

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

      // 如果是解除静音，标记第一次点击已完成
      if (!v.muted) {
        setFirstClick(false);
      }
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

      let animationFrameId: number;

      const updateProgress = () => {
        if (v && !v.paused) {
          setCurrentTime(v.currentTime);
          animationFrameId = requestAnimationFrame(updateProgress);
        }
      };

      const onTimeUpdate = () => {
        if (v.paused) {
          setCurrentTime(v.currentTime);
        }
      };

      const onDurationChange = () => setDuration(v.duration);
      const onProgress = () => {
        const buf = v.buffered;
        if (buf.length) {
          setBufferedEnd(buf.end(buf.length - 1));
        }
      };

      const onPlay = () => {
        setPaused(false);
        animationFrameId = requestAnimationFrame(updateProgress);
      };

      const onPause = () => {
        setPaused(true);
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };

      const onVolumeChange = () => setMuted(v.muted);

      v.addEventListener("timeupdate", onTimeUpdate);
      v.addEventListener("durationchange", onDurationChange);
      v.addEventListener("progress", onProgress);
      v.addEventListener("play", onPlay);
      v.addEventListener("pause", onPause);
      v.addEventListener("volumechange", onVolumeChange);

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        v.removeEventListener("timeupdate", onTimeUpdate);
        v.removeEventListener("durationchange", onDurationChange);
        v.removeEventListener("progress", onProgress);
        v.removeEventListener("play", onPlay);
        v.removeEventListener("pause", onPause);
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

    const onFullScreen = (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const v = innerRef.current;
      if (!v) return;

      console.log("尝试全屏前的视频状态:");
      console.log("  src:", v.src);
      console.log(
        "  readyState:",
        v.readyState,
        "(0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA)"
      );
      console.log(
        "  networkState:",
        v.networkState,
        "(0=NETWORK_EMPTY, 1=NETWORK_IDLE, 2=NETWORK_LOADING, 3=NETWORK_NO_SOURCE)"
      );
      console.log("  duration:", v.duration);
      console.log("  paused:", v.paused);
      console.log("  ended:", v.ended);
      if (v.error) {
        console.error(
          "  视频错误 Video Error:",
          v.error.message,
          "代码 Code:",
          v.error.code
        );
      }
      console.log("  videoWidth:", v.videoWidth, "videoHeight:", v.videoHeight);

      os.match({
        windows: () => {
          v.requestFullscreen().catch((err) => {
            console.error("进入全屏失败:", err);
          });
        },
        macos: () => {},
        _: () => {},
      });
    };

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative w-full text-base text-white bg-transparent overflow-hidden",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={innerRef}
          className={cn([
            "w-full block",
            // controls && "cursor-pointer",
            className,
          ])}
          src={convertFileSrc(src)}
          poster={poster ? convertFileSrc(poster) : undefined}
          crossOrigin="anonymous"
          onClick={handleVideoClick}
        />

        {controls && (
          <div
            className={cn([
              "transition duration-300",
              !isHovering && !paused ? "opacity-0" : "opacity-100",
            ])}
          >
            <div className={cn(["absolute top-2 right-2"])}>
              <button
                className="bg-[rgba(38,38,38,0.3)] p-1 rounded-full cursor-pointer"
                onClick={onFullScreen}
              >
                <icons.arrowExpandDiagonal />
              </button>
            </div>
            {/* 底部控制栏 */}
            <div
              className={cn([
                "absolute bottom-0 left-0 right-0 w-full flex items-center px-3 py-2",
                "bg-gradient-to-t from-[rgba(0,0,0,0.6)] to-transparent",
              ])}
            >
              {/* 底部小播放按钮 */}
              <button
                className="bg-[rgba(38,38,38,0.3)] border-none rounded-full p-3 text-lg text-white cursor-pointer mr-2 relative"
                onClick={togglePlay}
                style={{ filter: "contrast(200)" }}
              >
                <AnimatePresence>
                  <motion.span
                    key={paused ? "play" : "pause"}
                    initial={{
                      opacity: 0,
                      filter: "blur(10px)",
                    }}
                    animate={{
                      opacity: 1,
                      filter: "blur(0px)",
                      transition: {
                        opacity: { duration: 0.15, delay: 0, ease: "linear" },
                        filter: { duration: 0.4, delay: 0, ease: "linear" },
                      },
                    }}
                    exit={{
                      opacity: 0,
                      filter: "blur(10px)",
                      transition: {
                        filter: { duration: 0.4, delay: 0, ease: "linear" },
                        opacity: { duration: 0.15, delay: 0.3, ease: "linear" },
                      },
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {paused ? (
                      <icons.mediaPlay size={12} />
                    ) : (
                      <icons.mediaPause size={12} />
                    )}
                  </motion.span>
                </AnimatePresence>
              </button>

              {/* 音量按钮 */}
              <button
                className="bg-[rgba(38,38,38,0.3)] border-none rounded-full p-3 text-lg text-white cursor-pointer mr-2 relative"
                onClick={toggleMute}
                style={{ filter: "contrast(200)" }}
              >
                <AnimatePresence>
                  <motion.span
                    key={muted ? "muted" : "unmuted"}
                    initial={{ opacity: 0, filter: "blur(10px)" }}
                    animate={{
                      opacity: 1,
                      filter: "blur(0px)",
                      transition: {
                        opacity: { duration: 0.15, delay: 0, ease: "linear" },
                        filter: { duration: 0.4, delay: 0, ease: "linear" },
                      },
                    }}
                    exit={{
                      opacity: 0,
                      filter: "blur(10px)",
                      transition: {
                        filter: { duration: 0.4, delay: 0, ease: "linear" },
                        opacity: { duration: 0.15, delay: 0.3, ease: "linear" },
                      },
                    }}
                    transition={{
                      opacity: { duration: 0.15, ease: "linear" },
                      filter: { duration: 0.4, ease: "linear" },
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ filter: "contrast(200) blur(0.2px)" }}
                  >
                    {muted ? (
                      <icons.volumeOff size={12} />
                    ) : (
                      <icons.volumeUp size={12} />
                    )}
                  </motion.span>
                </AnimatePresence>
              </button>

              {/* 进度条 */}
              <div
                className={cn([
                  "relative flex-1 h-0.5 mx-3 cursor-pointer rounded-full transition shadow",
                  "hover:shadow-[0_1px_3px_rgba(238,238,238,0.06),0_3px_6px_rgba(235,235,235,0.06),0_6px_12px_rgba(236,236,236,0.06)]",
                  "before:absolute before:content-[''] before:left-0 before:right-0 before:h-[12px] before:top-[-5px] before:z-10",
                ])}
                onClick={onSeek}
                onMouseMove={onHover}
                onMouseLeave={() => setHoverTime(null)}
              >
                <div
                  className="absolute top-0 left-0 h-full bg-[rgba(38,38,38,0.5)] rounded-full"
                  style={{
                    width: `${
                      duration > 0 ? (bufferedEnd / duration) * 100 : 0
                    }%`,
                    transition: bufferedEnd > 0 ? "width 0.25s linear" : "none",
                  }}
                />
                <div
                  className="absolute top-0 left-0 h-full bg-white/70 rounded-full"
                  style={{
                    width: `${
                      duration > 0 ? (currentTime / duration) * 100 : 0
                    }%`,
                    transition:
                      currentTime > 0.1 ? "width 0.25s linear" : "none",
                  }}
                />
                {hoverTime !== null && (
                  <div
                    className="absolute top-[-2em] -translate-x-1/2 bg-[rgba(38,38,38,0.45)] px-1.5 py-0.5 rounded text-sm text-white/70"
                    style={{ left: `${(hoverTime / duration) * 100}%` }}
                  >
                    {formatTime(hoverTime)}
                  </div>
                )}
              </div>

              {/* 时间显示 */}
              <div className="text-xs font-mono text-white ml-2">
                {formatTime(duration - currentTime)}
              </div>
            </div>
          </div>
        )}
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
