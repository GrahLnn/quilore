import React, { MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils"; // 假设这是你的工具函数
import { icons } from "../assets/icons"; // 假设这是你的图标路径

// formatTime 函数可以复用或移到公共工具类
const formatTime = (t: number): string => {
  const m = Math.floor(t / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

interface VideoControlsProps {
  paused: boolean;
  muted: boolean;
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  hoverTime: number | null;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onSeek: (e: MouseEvent<HTMLDivElement>) => void;
  onHoverProgress: (e: MouseEvent<HTMLDivElement>) => void;
  onLeaveProgress: () => void;
  onFullScreen: (e: MouseEvent<HTMLButtonElement>) => void;
  isVisible: boolean; // 控制整体的显隐，用于opacity过渡
}

const VideoControls = React.memo<VideoControlsProps>(
  ({
    paused,
    muted,
    currentTime,
    duration,
    bufferedEnd,
    hoverTime,
    onTogglePlay,
    onToggleMute,
    onSeek,
    onHoverProgress,
    onLeaveProgress,
    onFullScreen,
    isVisible,
  }) => {
    // console.log("VideoControls 重新渲染", { currentTime, isVisible }); // 用于调试

    // 如果视频还没加载时长，或者时长为0，可以不渲染控制条或显示加载状态
    if (duration === 0 && currentTime === 0) {
      return null;
    }

    return (
      <div
        className={cn([
          "transition duration-300",
          isVisible ? "opacity-100" : "opacity-0", // 根据 isVisible 控制显隐
          "pointer-events-auto", // 确保可见时可交互
        ])}
      >
        <div className={cn(["absolute top-2 right-2"])}>
          <button
            className="bg-[rgba(38,38,38,0.3)] p-1 rounded-full cursor-pointer"
            onClick={onFullScreen}
            aria-label="全屏"
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
          {/* 播放/暂停按钮 */}
          <button
            className="bg-[rgba(38,38,38,0.3)] border-none rounded-full p-3 text-lg text-white cursor-pointer mr-2 relative"
            onClick={onTogglePlay}
            style={{ filter: "contrast(200)" }}
            aria-label={paused ? "播放" : "暂停"}
          >
            <AnimatePresence>
              <motion.span /* ... motion ... */>
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
            onClick={onToggleMute}
            style={{ filter: "contrast(200)" }}
            aria-label={muted ? "取消静音" : "静音"}
          >
            <AnimatePresence>
              <motion.span /* ... motion ... */>
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
              /* ... 样式 ... */
            ])}
            onClick={onSeek}
            onMouseMove={onHoverProgress}
            onMouseLeave={onLeaveProgress}
          >
            <div // 缓冲进度
              className="absolute top-0 left-0 h-full bg-[rgba(38,38,38,0.5)] rounded-full"
              style={{
                width: `${duration > 0 ? (bufferedEnd / duration) * 100 : 0}%`,
                transition: bufferedEnd > 0 ? "width 0.25s linear" : "none",
              }}
            />
            <div // 播放进度
              className="absolute top-0 left-0 h-full bg-white/70 rounded-full"
              style={{
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                // 避免在拖动或初始时有不自然的过渡
                transition:
                  currentTime > 0.1 && currentTime < duration && !hoverTime
                    ? "width 0.25s linear"
                    : "none",
              }}
            />
            {hoverTime !== null &&
              duration > 0 && ( // 预览时间
                <div
                  className="absolute top-[-2em] -translate-x-1/2 bg-[rgba(38,38,38,0.45)] px-1.5 py-0.5 rounded text-sm text-white/70 pointer-events-none"
                  style={{ left: `${(hoverTime / duration) * 100}%` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
          </div>

          {/* 时间显示 */}
          <div className="text-xs font-mono text-white ml-2">
            {/* 确保显示的时间不为负 */}
            {formatTime(Math.max(0, duration - currentTime))}
          </div>
        </div>
      </div>
    );
  }
);
VideoControls.displayName = "VideoControls";
export default VideoControls;
