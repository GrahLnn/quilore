import { convertFileSrc } from "@tauri-apps/api/core";
import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  useState,
  useEffect,
  MouseEvent,
  useCallback,
  memo,
  useMemo,
} from "react";
import useElementInView from "../hooks/view";
import { clearVideo } from "../utils/media";
import { station } from "../subpub/buses";
import { Asset } from "../cmd/commands";
import { crab } from "../cmd/commandAdapter";
import { cn } from "@/lib/utils";
import { icons } from "../assets/icons";
import { motion, AnimatePresence } from "motion/react";
import { throttle } from "lodash";
import { toggleVisibility } from "@/src/state_machine/barVisible";

const formatTime = (t: number): string => {
  const m = Math.floor(t / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

interface MorphButton {
  state: boolean;
  onClick: (e: MouseEvent<HTMLElement>) => void;
  icona: React.ReactNode;
  iconb: React.ReactNode;
  stateName: [string, string];
}

const MorphButton = memo(function MorphButtonComp({
  state,
  onClick,
  icona,
  iconb,
  stateName,
}: MorphButton) {
  const [isAnimating, setIsAnimating] = useState(false);
  return (
    <button
      className={cn([
        "bg-[rgba(38,38,38,0.3)] border-none rounded-full p-3 text-lg text-white cursor-pointer mr-2 relative",
      ])}
      onClick={onClick}
      style={{ filter: isAnimating ? "contrast(200)" : undefined }}
      aria-label={state ? stateName[0] : stateName[1]}
    >
      <AnimatePresence>
        <motion.span
          key={state ? stateName[0] : stateName[1]}
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
          className="absolute inset-0 flex items-center justify-center"
          onAnimationStart={() => setIsAnimating(true)}
          onAnimationComplete={() => setIsAnimating(false)}
        >
          {state ? icona : iconb}
        </motion.span>
      </AnimatePresence>
    </button>
  );
});

interface FullScreenProp {
  is_fullscreen: boolean;
  onClick: (e: MouseEvent<HTMLElement>) => void;
}

const FullScreenButton = memo(function FullScreenButtonComp({
  is_fullscreen,
  onClick,
}: FullScreenProp) {
  return (
    <MorphButton
      state={!is_fullscreen}
      onClick={onClick}
      stateName={["Fullscreen", "Exit Fullscreen"]}
      icona={<icons.arrowExpandDiagonal />}
      iconb={<icons.arrowReduceDiagonal />}
    />
  );
});

interface PauseButtonProp {
  paused: boolean;
  onClick: (e: MouseEvent<HTMLElement>) => void;
}

const PauseButton = memo(function PauseButtonComp({
  paused,
  onClick,
}: PauseButtonProp) {
  return (
    <MorphButton
      state={paused}
      onClick={onClick}
      stateName={["Play", "Pause"]}
      icona={<icons.mediaPlay size={12} />}
      iconb={<icons.mediaPause size={12} />}
    />
  );
});

interface MuteButtonProp {
  muted: boolean;
  onClick: (e: MouseEvent<HTMLElement>) => void;
}

const MuteButton = memo(function MuteButtonComp({
  muted,
  onClick,
}: MuteButtonProp) {
  return (
    <MorphButton
      state={muted}
      onClick={onClick}
      stateName={["Mute", "Unmute"]}
      icona={<icons.volumeOff size={12} />}
      iconb={<icons.volumeUp size={12} />}
    />
  );
});

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
  function TheVideoComp(
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
  ) {
    const innerRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const bufferRef = useRef<HTMLDivElement>(null);
    const hoverTooltipRef = useRef<HTMLDivElement>(null);
    const timeDisplayRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(externalRef, () => innerRef.current!, []);

    const [paused, setPaused] = useState<boolean>(!autoPlay);
    const [muted, setMuted] = useState<boolean>(initialMuted);
    const [duration, setDuration] = useState<number>(0);
    const [bufferedEnd, setBufferedEnd] = useState<number>(0);
    const [firstClick, setFirstClick] = useState<boolean>(true);
    const [isHovering, setIsHovering] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [wasPlayingBeforeDrag, setWasPlayingBeforeDrag] =
      useState<boolean>(false);
    const [isDraggingPause, setIsDraggingPause] = useState<boolean>(false);
    const [recentlyDragged, setRecentlyDragged] = useState<boolean>(false);
    const [isMouseInside, setIsMouseInside] = useState<boolean>(false);

    const videoSrc = useMemo(() => convertFileSrc(src), [src]);
    const posterSrc = useMemo(
      () => (poster ? convertFileSrc(poster) : undefined),
      [poster]
    );

    // 节流 seek 函数，支持 fastSeek
    const seekTo = useCallback((sec: number) => {
      const v = innerRef.current;
      if (!v) return;

      // 使用 fastSeek 如果支持，否则回退到 currentTime
      if ("fastSeek" in v && typeof (v as any).fastSeek === "function") {
        (v as any).fastSeek(sec);
      } else {
        v.currentTime = sec;
      }
    }, []);

    const throttledSeek = useRef(
      throttle(seekTo, 80, { trailing: true }) // ≈12 fps，足够平滑
    ).current;

    // 立即更新UI的函数
    const updateUIImmediately = useCallback(
      (pct: number, newTime: number) => {
        // 立即更新进度条位置
        if (progressRef.current) {
          progressRef.current.style.width = `${pct * 100}%`;
        }
        // 立即更新时间显示
        if (timeDisplayRef.current && duration > 0) {
          timeDisplayRef.current.textContent = formatTime(duration - newTime);
        }
      },
      [duration]
    );

    // 计算百分比的辅助函数
    const calcPct = useCallback(
      (e: MouseEvent<HTMLDivElement>, target?: HTMLDivElement) => {
        const element = target || e.currentTarget;
        const rect = element.getBoundingClientRect();
        return Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
      },
      []
    );

    const handleMouseEnter = useCallback(() => {
      if (!controls) return;
      setIsHovering(true);
      setIsMouseInside(true);
    }, [controls]);

    const handleMouseLeave = useCallback(() => {
      if (!controls) return;
      setIsMouseInside(false);
      // 如果正在拖动进度条，不隐藏控制条
      if (isDragging) return;
      setIsHovering(false);
    }, [controls, isDragging]);

    useEffect(() => {
      if (
        !isDragging &&
        !isDraggingPause &&
        !recentlyDragged &&
        !isMouseInside
      ) {
        setIsHovering(false);
      }
    }, [isDragging, isDraggingPause, recentlyDragged, isMouseInside]);

    const handleVideoClick = useCallback(
      (e: MouseEvent<HTMLElement>) => {
        if (!controls || isDragging || isDraggingPause || recentlyDragged)
          return;
        const v = innerRef.current;
        if (!v) return;

        if (firstClick && muted) {
          v.muted = false;
          setFirstClick(false);
          if (v.paused) {
            v.play().catch(() => {});
          }
        } else {
          togglePlay(e);
        }
      },
      [
        controls,
        firstClick,
        muted,
        isDragging,
        isDraggingPause,
        recentlyDragged,
      ]
    );

    const togglePlay = useCallback((e: MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      const v = innerRef.current;
      if (!v) return;
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    }, []);

    const toggleMute = useCallback((e: MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      const v = innerRef.current;
      if (!v) return;
      v.muted = !v.muted;
      if (!v.muted) setFirstClick(false);
    }, []);

    const toggleFullScreen = useCallback(
      (e: MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        setIsFullscreen(!isFullscreen);
      },
      [isFullscreen]
    );

    // Effect 1: Setup video properties like initial muted state and autoplay
    useEffect(() => {
      const v = innerRef.current;
      if (!v) return;

      v.muted = initialMuted;
      // The 'volumechange' event listener will call setMuted to sync state.

      if (autoPlay) {
        v.play().catch(() => {});
      }
      // `paused` state is initialized to `!autoPlay`.
      // `play` event will set `paused` to `false`.
      // `pause` event (if autoplay fails and browser pauses) will set `paused` to `true`.
    }, [autoPlay, initialMuted]);

    // Effect 2: Handle 'ended' event for looping
    useEffect(() => {
      const v = innerRef.current;
      if (!v) return;

      const handleEnded = () => {
        if (loop && v) {
          // `loop` prop from closure
          v.currentTime = 0;
          v.play().catch(() => {});
        }
      };

      v.addEventListener("ended", handleEnded);
      return () => {
        v.removeEventListener("ended", handleEnded);
      };
    }, [loop]); // Only depends on the `loop` prop

    // Effect 3: Main event listeners for video state synchronization (play, pause, timeupdate, etc.)
    // These are active only when `controls` is true.
    useEffect(() => {
      const v = innerRef.current;
      if (!v || !controls) return;

      const onLoadedMetadata = () => {
        setDuration(v.duration);
      };

      const onDurationChange = () => setDuration(v.duration);

      const onProgress = () => {
        const buf = v.buffered;
        if (buf.length > 0 && bufferRef.current) {
          const bufEnd = buf.end(buf.length - 1);
          const pct = v.duration > 0 ? (bufEnd / v.duration) * 100 : 0;
          bufferRef.current.style.width = `${pct}%`;
          setBufferedEnd(bufEnd);
        }
      };

      const onTimeUpdate = () => {
        // 如果正在拖拽，不更新时间显示，避免冲突
        if (isDragging) return;

        const v = innerRef.current;
        if (v) {
          if (timeDisplayRef.current) {
            timeDisplayRef.current.textContent = formatTime(
              v.duration - v.currentTime
            );
          }
        }
      };

      // 强制渲染帧的函数 - 在seeked事件中触发
      const onSeeked = () => {
        if (isDragging) {
          // 在拖动过程中，通过单帧播放确保帧得到渲染
          const v = innerRef.current;
          if (v && v.paused) {
            // "单帧播放"技巧：播一下立刻停
            v.play()
              .then(() => v.pause())
              .catch(() => {});
          }
        }
      };

      const onPlay = () => {
        // 只有非拖动期间的播放事件才更新paused状态
        if (!isDraggingPause) {
          setPaused(false);
        }
      };
      const onPause = () => {
        const v = innerRef.current; // 获取 video 元素的当前引用
        if (!v) return;
        if (v.ended && loop) return;

        // 只有非拖动期间的暂停事件才更新paused状态
        if (!isDraggingPause) {
          setPaused(true);
        }
      };
      const onVolumeChange = () => setMuted(v.muted);
      const onEnded = () => {
        if (loop) {
          // console.log("Looping: 'ended' event is being ignored.");
          return;
        }
        setPaused(true);
      };

      v.addEventListener("loadedmetadata", onLoadedMetadata);
      v.addEventListener("durationchange", onDurationChange);
      v.addEventListener("progress", onProgress);
      v.addEventListener("play", onPlay);
      v.addEventListener("pause", onPause);
      v.addEventListener("volumechange", onVolumeChange);
      v.addEventListener("timeupdate", onTimeUpdate);
      v.addEventListener("seeked", onSeeked);
      v.addEventListener("ended", onEnded);

      // Manually trigger handlers if data is already available (e.g. video loaded before effect ran)
      if (v.readyState >= 1) {
        // HAVE_METADATA
        onLoadedMetadata();
      }
      if (v.buffered.length > 0) {
        // Check if buffer info is available
        onProgress();
      }

      return () => {
        v.removeEventListener("loadedmetadata", onLoadedMetadata);
        v.removeEventListener("durationchange", onDurationChange);
        v.removeEventListener("progress", onProgress);
        v.removeEventListener("play", onPlay);
        v.removeEventListener("pause", onPause);
        v.removeEventListener("volumechange", onVolumeChange);
        v.removeEventListener("timeupdate", onTimeUpdate);
        v.removeEventListener("seeked", onSeeked);
        v.removeEventListener("ended", onEnded);
      };
    }, [controls, isDragging, isDraggingPause, loop]); // 添加isDraggingPause依赖

    // Effect 4: RequestAnimationFrame loop for smooth progress updates when playing
    useEffect(() => {
      const v = innerRef.current;
      if (!v || !controls || paused || isDragging) {
        // 如果正在拖拽，不要通过RAF更新进度条
        return;
      }

      let animationFrameId: number;
      const animationLoop = () => {
        // Ensure elements are still mounted and video is valid
        if (v && progressRef.current && !isDragging) {
          const pct = v.duration > 0 ? (v.currentTime / v.duration) * 100 : 0;
          progressRef.current.style.width = `${pct}%`;
          animationFrameId = requestAnimationFrame(animationLoop);
        }
      };

      animationFrameId = requestAnimationFrame(animationLoop);
      return () => {
        cancelAnimationFrame(animationFrameId); // Cleanup: cancel the frame
      };
    }, [paused, controls, duration, isDragging]); // 添加isDragging依赖

    const onSeek = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!controls) return;
        const v = innerRef.current;
        if (!v || duration <= 0) return;

        const pct = calcPct(e);
        const newTime = pct * duration;

        if (isDragging) {
          // 拖动时：节流seek + 立即更新UI
          throttledSeek(newTime);
          updateUIImmediately(pct, newTime);
        } else {
          // 点击时：直接seek
          seekTo(newTime);
          updateUIImmediately(pct, newTime);
        }
      },
      [
        controls,
        duration,
        isDragging,
        calcPct,
        throttledSeek,
        updateUIImmediately,
        seekTo,
      ]
    );

    const throttledUpdateTooltip = useRef(
      throttle(
        (
          vCurrent: HTMLVideoElement | null,
          tipCurrent: HTMLDivElement | null,
          clientX: number,
          targetRect: DOMRect,
          currentDuration: number
        ) => {
          if (!vCurrent || !tipCurrent || currentDuration === 0) {
            if (tipCurrent) tipCurrent.style.display = "none";
            return;
          }
          const pct = Math.min(
            Math.max((clientX - targetRect.left) / targetRect.width, 0),
            1
          );
          const sec = pct * currentDuration;
          tipCurrent.style.display = "block";
          tipCurrent.style.left = `${pct * 100}%`;
          tipCurrent.textContent = formatTime(sec);
        },
        50
      )
    ).current;

    const handleMouseDown = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!controls) return;
        const v = innerRef.current;
        if (!v) return;

        // 记录拖拽前的播放状态
        setWasPlayingBeforeDrag(!v.paused);
        // 设置拖动暂停标志
        setIsDraggingPause(true);
        // 开始拖拽时暂停视频以便实时预览
        if (!v.paused) {
          v.pause();
        }

        setIsDragging(true);
        onSeek(e); // 立即执行一次seek
        e.preventDefault();
      },
      [controls, onSeek]
    );

    const handleMouseMove = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!controls) return;

        // 处理拖拽
        if (isDragging) {
          const pct = calcPct(e);
          const newTime = pct * duration;

          // 节流seek + 立即更新UI
          throttledSeek(newTime);
          updateUIImmediately(pct, newTime);
        } else {
          // 处理悬停工具提示
          throttledUpdateTooltip(
            innerRef.current,
            hoverTooltipRef.current,
            e.clientX,
            e.currentTarget.getBoundingClientRect(),
            duration
          );
        }
      },
      [
        controls,
        isDragging,
        duration,
        calcPct,
        throttledSeek,
        updateUIImmediately,
        throttledUpdateTooltip,
      ]
    );

    const handleMouseUp = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!controls) return;
        const v = innerRef.current;
        if (!v) return;

        setIsDragging(false);
        // 清除拖动暂停标志
        setIsDraggingPause(false);

        // 设置最近拖动标志，防止立即触发视频点击
        setRecentlyDragged(true);
        setTimeout(() => {
          setRecentlyDragged(false);
        }, 100); // 100ms 延迟足够处理事件时序问题

        // 拖拽结束后，根据之前的播放状态决定是否继续播放
        if (wasPlayingBeforeDrag && v.paused) {
          v.play().catch(() => {});
        }
      },
      [controls, wasPlayingBeforeDrag]
    );

    // 添加全局鼠标事件监听器处理拖拽结束
    useEffect(() => {
      if (!isDragging) return;

      const handleGlobalMouseMove = (e: globalThis.MouseEvent) => {
        if (!controls) return;
        const progressBar = progressRef.current?.parentElement;
        if (!progressBar) return;

        const rect = progressBar.getBoundingClientRect();
        const pct = Math.min(
          Math.max((e.clientX - rect.left) / rect.width, 0),
          1
        );

        if (duration > 0) {
          const newTime = pct * duration;
          // 节流seek + 立即更新UI
          throttledSeek(newTime);
          updateUIImmediately(pct, newTime);
        }
      };

      const handleGlobalMouseUp = () => {
        const v = innerRef.current;
        setIsDragging(false);
        // 清除拖动暂停标志
        setIsDraggingPause(false);

        // 设置最近拖动标志，防止立即触发视频点击
        setRecentlyDragged(true);
        setTimeout(() => {
          setRecentlyDragged(false);
        }, 100); // 100ms 延迟足够处理事件时序问题

        // 拖拽结束后，根据之前的播放状态决定是否继续播放
        if (wasPlayingBeforeDrag && v && v.paused) {
          v.play().catch(() => {});
        }
      };

      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }, [
      isDragging,
      controls,
      duration,
      wasPlayingBeforeDrag,
      throttledSeek,
      updateUIImmediately,
    ]);

    const onHover = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if (!controls || isDragging) return; // 拖拽时不显示工具提示
        throttledUpdateTooltip(
          innerRef.current,
          hoverTooltipRef.current,
          e.clientX,
          e.currentTarget.getBoundingClientRect(),
          duration
        );
      },
      [controls, duration, throttledUpdateTooltip, isDragging]
    );

    const onHoverLeave = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!controls) return;
        throttledUpdateTooltip.cancel();
        if (hoverTooltipRef.current) {
          hoverTooltipRef.current.style.display = "none";
        }
      },
      [controls, throttledUpdateTooltip]
    );

    useEffect(() => {
      return () => {
        throttledSeek.cancel();
        throttledUpdateTooltip.cancel();
      };
    }, [throttledSeek, throttledUpdateTooltip]);

    useEffect(() => {
      if (isFullscreen) {
        toggleVisibility(false);
        document.body.style.overflow = "hidden";
      } else {
        toggleVisibility(true);
        document.body.style.overflow = "";
      }
    }, [isFullscreen]);

    return (
      <motion.div
        ref={containerRef}
        className={cn([
          !isFullscreen
            ? [
                "relative text-base text-white bg-transparent overflow-hidden",
                className,
              ] // Ensure w-full h-full, and merge LazyVideo's className
            : "fixed top-8 left-0 w-screen z-50 flex items-center justify-center",
        ])}
        style={{
          height: isFullscreen ? "calc(100vh - 2rem)" : undefined,
          backdropFilter: "blur(24px)",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleVideoClick}
        // layout
      >
        <motion.video
          ref={innerRef}
          className={cn([
            "mx-auto my-auto max-h-full max-w-full object-contain",
          ])}
          src={videoSrc}
          poster={posterSrc}
          preload="auto"
          playsInline
          crossOrigin="anonymous"
          // layout
        />

        {controls && (
          <div
            className={cn([
              "transition duration-300",
              !isHovering && !paused ? "opacity-0" : "opacity-100",
            ])}
          >
            <div className={cn(["absolute top-2 right-2"])}>
              <FullScreenButton
                is_fullscreen={isFullscreen}
                onClick={toggleFullScreen}
              />
            </div>
            <div
              className={cn([
                "absolute bottom-0 left-0 right-0 w-full flex items-center px-3 py-2",
                "easgrad",
              ])}
            >
              <PauseButton paused={paused} onClick={togglePlay} />

              <MuteButton muted={muted} onClick={toggleMute} />

              <div
                className={cn([
                  "relative flex-1 h-0.5 mx-3 cursor-pointer rounded-full transition shadow",
                  "hover:shadow-[0_1px_3px_rgba(238,238,238,0.06),0_3px_6px_rgba(235,235,235,0.06),0_6px_12px_rgba(236,236,236,0.06)]",
                  "before:absolute before:content-[''] before:left-0 before:right-0 before:h-[12px] before:top-[-5px] before:z-10",
                  isDragging ? "cursor-grabbing" : "cursor-pointer",
                ])}
                onClick={onSeek}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={onHoverLeave}
              >
                <div
                  ref={bufferRef}
                  className="absolute top-0 left-0 h-full bg-[rgba(38,38,38,0.5)] rounded-full"
                  style={{
                    width: `${
                      duration > 0 ? (bufferedEnd / duration) * 100 : 0
                    }%`,
                    transition: bufferedEnd > 0 ? "width 0.25s linear" : "none",
                  }}
                />
                <div
                  ref={progressRef}
                  className="absolute top-0 left-0 h-full bg-white/70 rounded-full"
                />
                <div
                  ref={hoverTooltipRef}
                  className="absolute top-[-2em] -translate-x-1/2 bg-[rgba(38,38,38,0.45)] px-1.5 py-0.5 rounded text-sm text-white/70 pointer-events-none hidden" // Added 'hidden' for initial state
                />
              </div>

              <div
                ref={timeDisplayRef}
                className="text-xs font-mono text-white ml-2"
              />
            </div>
          </div>
        )}
      </motion.div>
    );
  }
);

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
  const assetState = station.assetState.useSee();
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
  }, [asset.path]); // Added asset.path to dependencies

  // 当 inView 为 true 且 videoRef 挂载时，保存 videoEl
  useEffect(() => {
    if (inView && videoRef.current) {
      setVideoEl(videoRef.current);
      setStoredRatio((prev) => {
        if (containerRef.current) {
          const newRatio: [number, number] = [
            containerRef.current.clientWidth,
            containerRef.current.clientHeight,
          ];
          if (!prev || newRatio[0] !== prev[0] || newRatio[1] !== prev[1]) {
            return newRatio;
          }
        }
        return prev;
      });
    }
  }, [inView]); // videoRef.current is not a typical dependency, but effect re-runs if inView changes.

  // 当 inView 为 false 时，用 videoEl 调用 clearVideo，并重置 videoEl
  useEffect(() => {
    // This effect now correctly calls clearVideo only when the video goes out of view
    // and videoEl is present.
    if (!inView && videoEl) {
      clearVideo(videoEl);
    }
    // The original cleanup `return () => { if (!inView && videoEl) clearVideo(videoEl); };`
    // was a bit redundant. If TheVideo unmounts, its own cleanups are now more robust.
    // This effect's main job is to clear video when scrolled out, not on LazyVideo unmount.
  }, [inView, videoEl]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        aspectRatio: `${w} / ${h}`,
        height: storedRatio ? `${storedRatio[1]}px` : undefined,
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
          // Add an aria-label for accessibility if this placeholder is significant
          aria-label={ariaLabel || "Loading video content"}
        />
      )}
    </div>
  );
};

export default LazyVideo;
