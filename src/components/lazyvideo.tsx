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
  onClick: () => void;
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
  onClick: () => void;
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
  onClick: () => void;
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
  onClick: () => void;
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

    const videoSrc = useMemo(() => convertFileSrc(src), [src]);
    const posterSrc = useMemo(
      () => (poster ? convertFileSrc(poster) : undefined),
      [poster]
    );

    const handleMouseEnter = useCallback(() => {
      if (!controls) return;
      setIsHovering(true);
    }, [controls]);

    const handleMouseLeave = useCallback(() => {
      if (!controls) return;
      setIsHovering(false);
    }, [controls]);

    const handleVideoClick = useCallback(() => {
      if (!controls) return;
      const v = innerRef.current;
      if (!v) return;

      if (firstClick && muted) {
        v.muted = false;
        setFirstClick(false);
        if (v.paused) {
          v.play().catch(() => {});
        }
      } else {
        togglePlay();
      }
    }, [controls, firstClick, muted]);

    const togglePlay = useCallback(() => {
      const v = innerRef.current;
      if (!v) return;
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    }, []);

    const toggleMute = useCallback(() => {
      const v = innerRef.current;
      if (!v) return;
      v.muted = !v.muted;
      if (!v.muted) setFirstClick(false);
    }, []);

    const toggleFullScreen = useCallback(() => {
      setIsFullscreen(!isFullscreen);
    }, [isFullscreen]);

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
        // if (v) setDisplayTime(formatTime(v.duration - v.currentTime));
        if (v && timeDisplayRef.current)
          timeDisplayRef.current.textContent = formatTime(
            v.duration - v.currentTime
          );
      };

      const onPlay = () => {
        setPaused(false);
      };
      const onPause = () => {
        const v = innerRef.current; // 获取 video 元素的当前引用
        if (!v) return;
        if (v.ended && loop) return;

        setPaused(true);
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
        v.removeEventListener("ended", onEnded);
      };
    }, [controls]); // This effect now correctly depends on `controls`

    // Effect 4: RequestAnimationFrame loop for smooth progress updates when playing
    useEffect(() => {
      const v = innerRef.current;
      if (!v || !controls || paused) {
        // Do not run RAF if no video, controls are off, or video is paused.
        return;
      }

      let animationFrameId: number;
      const animationLoop = () => {
        // Ensure elements are still mounted and video is valid
        if (v && progressRef.current) {
          const pct = v.duration > 0 ? (v.currentTime / v.duration) * 100 : 0;
          progressRef.current.style.width = `${pct}%`;
          animationFrameId = requestAnimationFrame(animationLoop);
        }
      };

      animationFrameId = requestAnimationFrame(animationLoop);
      return () => {
        cancelAnimationFrame(animationFrameId); // Cleanup: cancel the frame
      };
    }, [paused, controls, duration]); // Re-run if paused state, controls, or duration changes.
    // Duration is included because formatTime depends on it for remaining time.

    const onSeek = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if (!controls) return;
        const v = innerRef.current;
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        const pct = Math.min(
          Math.max((e.clientX - rect.left) / rect.width, 0),
          1
        );
        if (v && duration > 0) {
          v.currentTime = pct * duration;
          // `timeupdate` event will fire after seeking, updating `displayTime` state
        }
      },
      [controls, duration]
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

    const onHover = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if (!controls) return;
        throttledUpdateTooltip(
          innerRef.current,
          hoverTooltipRef.current,
          e.clientX,
          e.currentTarget.getBoundingClientRect(),
          duration
        );
      },
      [controls, duration, throttledUpdateTooltip]
    );

    const onHoverLeave = useCallback(() => {
      if (!controls) return;
      throttledUpdateTooltip.cancel();
      if (hoverTooltipRef.current) {
        hoverTooltipRef.current.style.display = "none";
      }
    }, [controls, throttledUpdateTooltip]);

    useEffect(() => {
      return () => {
        throttledUpdateTooltip.cancel();
      };
    }, [throttledUpdateTooltip]);

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
        // layout
      >
        <motion.video
          ref={innerRef}
          className={cn(["mx-auto my-auto max-h-full max-w-full object-contain"])}
          src={videoSrc}
          poster={posterSrc}
          crossOrigin="anonymous"
          onClick={handleVideoClick}
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
                "bg-gradient-to-t from-[rgba(0,0,0,0.6)] to-transparent",
              ])}
            >
              <PauseButton paused={paused} onClick={togglePlay} />

              <MuteButton muted={muted} onClick={toggleMute} />

              <div
                className={cn([
                  "relative flex-1 h-0.5 mx-3 cursor-pointer rounded-full transition shadow",
                  "hover:shadow-[0_1px_3px_rgba(238,238,238,0.06),0_3px_6px_rgba(235,235,235,0.06),0_6px_12px_rgba(236,236,236,0.06)]",
                  "before:absolute before:content-[''] before:left-0 before:right-0 before:h-[12px] before:top-[-5px] before:z-10",
                ])}
                onClick={onSeek}
                onMouseMove={onHover}
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
