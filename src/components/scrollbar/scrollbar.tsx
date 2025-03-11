import { cn } from "@/lib/utils";
import { type BarPayload, BarState } from "./barObserver";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// 注册 ScrollTrigger 插件
gsap.registerPlugin(ScrollTrigger);

export function Scrollbar() {
  const [state, setState] = useState<BarPayload>({
    scrollTop: 0,
    scrollHeight: 0,
  });

  useEffect(() => {
    const unsubscribe = BarState.subscribe((data) => {
      setState(data);
    });
    return unsubscribe;
  }, []);

  const barRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // 是否展示滚动条（如果内容太少就不展示）
  const [showScrollbar, setShowScrollbar] = useState(false);
  // 是否正在拖拽
  const [isDragging, setIsDragging] = useState(false);

  // 当 state.scrollTop 或 state.scrollHeight 等变化时，更新滚动条位置
  useEffect(() => {
    const thumb = thumbRef.current;
    const track = trackRef.current;
    if (!thumb || !track) return;

    // 窗口可视高度
    const windowHeight = window.innerHeight;
    // 内容总高度
    const contentHeight = state.scrollHeight;

    // 计算内容可滚动的最大距离
    // （假设滚动的是整个 window，就取 contentHeight - windowHeight）
    const maxScroll = contentHeight - windowHeight;

    // 计算窗口高度占内容高度的比例
    const scrollRatio = windowHeight / contentHeight;

    // 内容不足以滚动，或者没初始化，则隐藏滚动条
    if (scrollRatio >= 1 || !contentHeight) {
      setShowScrollbar(false);
      return;
    }
    setShowScrollbar(true);

    // 计算滑块的高度（最小 20）
    const thumbHeight = Math.max(20, scrollRatio * track.clientHeight);

    // 算出当前滚动在 [0 ~ maxScroll] 的一个百分比
    const scrollPercentage = maxScroll > 0 ? state.scrollTop / maxScroll : 0;

    // 滑块在轨道上的可移动范围
    const trackSpace = track.clientHeight - thumbHeight;
    // 当前滑块在轨道中的位置
    const thumbPosition = scrollPercentage * trackSpace;

    // 让滑块平滑移动到新位置
    gsap.to(thumb, {
      height: thumbHeight,
      y: thumbPosition,
      duration: isDragging ? 0.05 : 0.2, // 拖动时使用更短的动画时间保持响应性
      ease: "power2.out",
      overwrite: true // 确保动画不会堆叠
    });
  }, [state.scrollTop, state.scrollHeight, isDragging]);

  useEffect(() => {
    const thumb = thumbRef.current;
    const track = trackRef.current;
    if (!thumb || !track) return;

    // 拖动时的一些临时变量
    let startY = 0; // 鼠标按下瞬间的 Y 坐标
    let startScrollTop = 0; // 鼠标按下瞬间的 scrollTop

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      startY = e.clientY;
      startScrollTop = state.scrollTop;

      // 禁止选中文本
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = e.clientY - startY;

      // thumb 在轨道移动的总距离 = trackHeight - thumbHeight
      // 内容可滚动的总距离 = state.scrollHeight - window.innerHeight
      const windowHeight = window.innerHeight;
      const maxScroll = state.scrollHeight - windowHeight;

      const trackHeight = track.clientHeight;
      const thumbHeight = thumb.clientHeight;

      // (内容可滚动距离) / (滑块可移动距离)
      const moveRatio = maxScroll / (trackHeight - thumbHeight);

      // 根据鼠标的移动距离，计算新的内容滚动位置
      let newScrollTop = startScrollTop + deltaY * moveRatio;
      // 边界处理
      newScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));

      // 使用GSAP实现平滑滚动，即使在拖动过程中
      gsap.to(window, {
        scrollTo: { y: newScrollTop },
        duration: 0.15,  // 短暂的动画时间，保持响应性但又有平滑效果
        ease: "power1.out",
        overwrite: true  // 覆盖之前未完成的动画
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    // 轨道点击滚动到对应位置
    const onTrackClick = (e: MouseEvent) => {
      // 如果点击的是滑块本身，不处理
      if (e.target === thumb) return;

      const trackRect = track.getBoundingClientRect();
      const clickPosition = e.clientY - trackRect.top;

      // 计算滑块高度
      const windowHeight = window.innerHeight;
      const scrollRatio = windowHeight / state.scrollHeight;
      const thumbHeight = Math.max(20, scrollRatio * track.clientHeight);
      const halfThumbHeight = thumbHeight / 2;

      // 让点击落点尽量处在滑块正中
      let targetPosition = clickPosition - halfThumbHeight;
      const maxTrackPosition = track.clientHeight - thumbHeight;
      if (targetPosition < 0) targetPosition = 0;
      if (targetPosition > maxTrackPosition) targetPosition = maxTrackPosition;

      // 计算出占比，再算出最终应该滚动到的页面位置
      const scrollPercentage = targetPosition / maxTrackPosition;
      const maxScroll = state.scrollHeight - window.innerHeight;
      const targetScrollTop = scrollPercentage * maxScroll;

      gsap.to(window, {
        scrollTo: { y: targetScrollTop },
        duration: 0.5,
        ease: "power2.out",
      });
    };

    thumb.addEventListener("mousedown", onMouseDown);
    track.addEventListener("click", onTrackClick);

    return () => {
      thumb.removeEventListener("mousedown", onMouseDown);
      track.removeEventListener("click", onTrackClick);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [state.scrollTop, state.scrollHeight, isDragging]);

  const basecn = "right-1 w-1";

  return (
    <div
      ref={barRef}
      className={cn(["fixed top-8 bottom-2 pointer-events-auto z-10", basecn])}
      style={{ display: "block" }}
    >
      {/* 滚动轨道 */}
      <div
        ref={trackRef}
        className={cn(
          "fixed top-10 bottom-2",
          "rounded-full opacity-50 z-10",
          "bg-black/10 dark:bg-white/10",
          "opacity-0",
          basecn
        )}
        data-component="scroll-track"
      />
      {/* 滚动滑块 */}
      <div
        ref={thumbRef}
        className={cn(
          "fixed top-10 z-20",
          "rounded-full opacity-70 hover:opacity-100 transition-opacity duration-300 ease-in-out",
          "bg-black/30 dark:bg-white/30",
          basecn
        )}
        style={{
          display: showScrollbar ? "block" : "none",
          minHeight: "20px",
        }}
        data-component="scroll-thumb"
      />
    </div>
  );
}
