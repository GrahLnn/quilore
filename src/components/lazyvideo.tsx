import { convertFileSrc } from "@tauri-apps/api/core";
import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  useState,
  useEffect,
  MouseEvent,
} from "react";
import useElementInView from "../hooks/view"; // Not used in TheVideo directly, but in LazyVideo
import { clearVideo } from "../utils/media"; // Used in LazyVideo
import { useAssetState } from "../subpub/assetsState"; // Used in LazyVideo
import { Asset } from "../cmd/commands"; // Used in LazyVideo
import { crab } from "../cmd/commandAdapter"; // Used in LazyVideo
import { cn } from "@/lib/utils";
import { icons } from "../assets/icons";
import { motion, AnimatePresence } from "motion/react"; // Assuming this is framer-motion or similar
import { useOSName } from "../subpub/whichos";

const formatTime = (t: number): string => {
  const m = Math.floor(t / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

// LazyVideoProps and TheVideoProps remain the same
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
    const progressRef = useRef<HTMLDivElement>(null);
    const bufferRef = useRef<HTMLDivElement>(null);
    const hoverTooltipRef = useRef<HTMLDivElement>(null);
    const timeDisplayRef = useRef<HTMLDivElement>(null);
    const os = useOSName();

    useImperativeHandle(externalRef, () => innerRef.current!, []);

    const [paused, setPaused] = useState<boolean>(!autoPlay);
    const [muted, setMuted] = useState<boolean>(initialMuted);
    const [duration, setDuration] = useState<number>(0);
    const [bufferedEnd, setBufferedEnd] = useState<number>(0);
    const [firstClick, setFirstClick] = useState<boolean>(true);
    const [isHovering, setIsHovering] = useState<boolean>(false);

    const handleMouseEnter = () => {
      if (!controls) return;
      setIsHovering(true);
    };

    const handleMouseLeave = () => {
      if (!controls) return;
      setIsHovering(false);
    };

    const handleVideoClick = () => {
      if (!controls) return;
      const v = innerRef.current;
      if (!v) return;

      if (firstClick && muted) {
        v.muted = false;
        // setMuted(false); // Listener will update state
        setFirstClick(false);
        if (v.paused) {
          v.play().catch(() => {
            // setPaused(true); // Listener will update state
          });
        }
      } else {
        togglePlay();
      }
    };

    const togglePlay = () => {
      const v = innerRef.current;
      if (!v) return;
      if (v.paused) v.play();
      else v.pause();
    };

    const toggleMute = () => {
      const v = innerRef.current;
      if (!v) return;
      v.muted = !v.muted;
      // setMuted(v.muted); // Listener will update state
      if (!v.muted) {
        setFirstClick(false);
      }
    };

    // Effect 1: Setup video properties like initial muted state and autoplay
    useEffect(() => {
      const v = innerRef.current;
      if (!v) return;

      v.muted = initialMuted;
      // The 'volumechange' event listener will call setMuted to sync state.

      if (autoPlay) {
        v.play().catch(() => {
          // If autoplay fails, the 'pause' event will fire,
          // and its listener will call setPaused(true).
        });
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
          v.play().catch(() => {
            // 'pause' event listener will handle setPaused(true) if play fails
          });
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
      if (!v || !controls) {
        // If no video element or controls are disabled,
        // ensure no listeners are active (cleanup from previous render will have run).
        return;
      }

      const onLoadedMetadata = () => {
        setDuration(v.duration);
        // Update progress display once if video is paused.
        // If playing, the RAF loop (Effect 4) will handle updates.
        if (v.paused && progressRef.current && timeDisplayRef.current) {
          const pct = v.duration > 0 ? (v.currentTime / v.duration) * 100 : 0;
          progressRef.current.style.width = `${pct}%`;
          timeDisplayRef.current.textContent = formatTime(
            v.duration - v.currentTime
          );
        }
      };

      // timeupdate is mainly for when paused and currentTime changes (e.g., after seeking)
      const onTimeUpdate = () => {
        if (v.paused && progressRef.current && timeDisplayRef.current) {
          const pct = v.duration > 0 ? (v.currentTime / v.duration) * 100 : 0;
          progressRef.current.style.width = `${pct}%`;
          timeDisplayRef.current.textContent = formatTime(
            v.duration - v.currentTime
          );
        }
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

      const onPlay = () => setPaused(false);
      const onPause = () => setPaused(true);
      const onVolumeChange = () => setMuted(v.muted);

      v.addEventListener("loadedmetadata", onLoadedMetadata);
      v.addEventListener("timeupdate", onTimeUpdate);
      v.addEventListener("durationchange", onDurationChange);
      v.addEventListener("progress", onProgress);
      v.addEventListener("play", onPlay);
      v.addEventListener("pause", onPause);
      v.addEventListener("volumechange", onVolumeChange);

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
        v.removeEventListener("timeupdate", onTimeUpdate);
        v.removeEventListener("durationchange", onDurationChange);
        v.removeEventListener("progress", onProgress);
        v.removeEventListener("play", onPlay);
        v.removeEventListener("pause", onPause);
        v.removeEventListener("volumechange", onVolumeChange);
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
        if (v && progressRef.current && timeDisplayRef.current) {
          const pct = v.duration > 0 ? (v.currentTime / v.duration) * 100 : 0;
          progressRef.current.style.width = `${pct}%`;
          timeDisplayRef.current.textContent = formatTime(
            v.duration - v.currentTime
          );
          animationFrameId = requestAnimationFrame(animationLoop);
        }
      };

      animationFrameId = requestAnimationFrame(animationLoop); // Start the loop

      return () => {
        cancelAnimationFrame(animationFrameId); // Cleanup: cancel the frame
      };
    }, [paused, controls, duration]); // Re-run if paused state, controls, or duration changes.
    // Duration is included because formatTime depends on it for remaining time.

    const onSeek = (e: MouseEvent<HTMLDivElement>) => {
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
        // If paused, onTimeUpdate will update the display.
        // If playing, RAF will update.
      }
    };

    const onHover = (e: MouseEvent<HTMLDivElement>) => {
      if (!controls || duration === 0) return;
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const pct = Math.min(
        Math.max((e.clientX - rect.left) / rect.width, 0),
        1
      );
      const tip = hoverTooltipRef.current;
      if (!tip) return;
      const sec = pct * duration;
      tip.style.display = "block";
      tip.style.left = `${pct * 100}%`;
      tip.textContent = formatTime(sec);
    };

    const onHoverLeave = () => {
      if (hoverTooltipRef.current && controls) {
        hoverTooltipRef.current.style.display = "none";
      }
    };

    const onFullScreen = (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const v = innerRef.current;
      if (!v) return;

      // Standard fullscreen API
      if (v.requestFullscreen) {
        v.requestFullscreen().catch((err) =>
          console.error("Error attempting to enable full-screen mode:", err)
        );
      }
      // Fallbacks for older browsers (remove if not needed)
      // else if ((v as any).mozRequestFullScreen) { /* Firefox */
      //   (v as any).mozRequestFullScreen();
      // } else if ((v as any).webkitRequestFullscreen) { /* Chrome, Safari & Opera */
      //   (v as any).webkitRequestFullscreen();
      // } else if ((v as any).msRequestFullscreen) { /* IE/Edge */
      //   (v as any).msRequestFullscreen();
      // }
      // The os.match for windows specific behavior could be part of a broader fullscreen strategy
      // For now, using the standard API is generally preferred.
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
          className={cn(["w-full block", className])}
          src={convertFileSrc(src)}
          poster={poster ? convertFileSrc(poster) : undefined}
          crossOrigin="anonymous"
          onClick={handleVideoClick}
          // autoPlay, loop, muted are controlled via effects and direct DOM manipulation
          // to align with internal state management.
          // However, you *could* pass autoPlay and loop directly if preferred,
          // but initialMuted needs careful handling with the `muted` state.
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
            <div
              className={cn([
                "absolute bottom-0 left-0 right-0 w-full flex items-center px-3 py-2",
                "bg-gradient-to-t from-[rgba(0,0,0,0.6)] to-transparent",
              ])}
            >
              <button
                className="bg-[rgba(38,38,38,0.3)] border-none rounded-full p-3 text-lg text-white cursor-pointer mr-2 relative"
                onClick={togglePlay}
                style={{ filter: "contrast(200)" }}
                aria-label={paused ? "Play" : "Pause"}
              >
                <AnimatePresence>
                  <motion.span
                    key={paused ? "play" : "pause"}
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
                  >
                    {paused ? (
                      <icons.mediaPlay size={12} />
                    ) : (
                      <icons.mediaPause size={12} />
                    )}
                  </motion.span>
                </AnimatePresence>
              </button>

              <button
                className="bg-[rgba(38,38,38,0.3)] border-none rounded-full p-3 text-lg text-white cursor-pointer mr-2 relative"
                onClick={toggleMute}
                style={{ filter: "contrast(200)" }}
                aria-label={muted ? "Unmute" : "Mute"}
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
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ filter: "contrast(200) blur(0.2px)" }} // This style was duplicated, remove transition here if handled by motion
                  >
                    {muted ? (
                      <icons.volumeOff size={12} />
                    ) : (
                      <icons.volumeUp size={12} />
                    )}
                  </motion.span>
                </AnimatePresence>
              </button>

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
      </div>
    );
  }
);

TheVideo.displayName = "TheVideo";

// LazyVideo component remains unchanged as per the request to focus on TheVideo
// ... (rest of LazyVideo code)
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
  }, [asset.path]); // Added asset.path to dependencies

  // 当 inView 为 true 且 videoRef 挂载时，保存 videoEl
  useEffect(() => {
    if (inView && videoRef.current) {
      setVideoEl(videoRef.current);
      if (containerRef.current) {
        // Check added previously, good.
        setStoredRatio([
          containerRef.current.clientWidth,
          containerRef.current.clientHeight,
        ]);
      }
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
      className="transform-gpu" // Added for potential performance hint
      style={{
        width: "100%",
        aspectRatio: `${w} / ${h}`,
        // Using height like this can cause layout shifts if clientWidth isn't stable initially.
        // Consider setting height based on aspectRatio and width via CSS if possible,
        // or ensure storedRatio is only applied after a stable measurement.
        height: storedRatio ? `${storedRatio[1]}px` : undefined, // Keep original logic
      }}
    >
      {inView && exists ? (
        <TheVideo
          ref={videoRef}
          src={src}
          poster={poster}
          controls={controls}
          muted={muted} // Pass initialMuted correctly
          autoPlay={autoPlay}
          loop={loop}
          className={className}
          aria-label={ariaLabel} // Prop name is aria-label in HTML
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
