import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { type LightboxPayload, LightboxState } from "./lightboxObserver";
import { toggleVisibility } from "@/src/state_machine/barVisible";

export function Lightbox() {
  const [state, setState] = useState<LightboxPayload>({
    images: [],
    currentIndex: 0,
    isOpen: false,
  });
  const [toMax, setToMax] = useState(false);
  const [zoomable, setZoomable] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  // 订阅全局 LightboxState
  useEffect(() => {
    const unsubscribe = LightboxState.subscribe((data) => {
      if (state.isOpen && !data.isOpen) {
        // 当lightbox从打开变为关闭状态时，标记为正在退出
        setIsExiting(true);
        toggleVisibility(true);
        // 在动画完成后重置退出状态
        setTimeout(() => {
          setIsExiting(false);
        }, 200); // 与退出动画持续时间相匹配
      }
      setState(data);
    });
    return unsubscribe;
  }, [state.isOpen]);

  useEffect(() => {
    if (state.isOpen) {
      toggleVisibility(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setToMax(false);
    }

    return () => {
      document.body.style.pointerEvents = "";
    };
  }, [state.isOpen]);

  const currentImg = state.images[state.currentIndex];

  return (
    <AnimatePresence initial={false}>
      {state.isOpen && (
        <motion.div
          initial={{ backdropFilter: "blur(0px)", opacity: 0 }}
          animate={{
            backdropFilter: "blur(24px)",
            opacity: 1,
            transition: { duration: 0.3 },
          }}
          exit={{
            backdropFilter: "blur(0px)",
            opacity: 0,
            transition: { duration: 0.2 },
            pointerEvents: "none", // 在退出动画期间禁用指针事件
          }}
          className={cn([
            "fixed top-0 left-0 w-screen h-screen z-100 select-none pt-8",
            "flex justify-center ",
            zoomable && toMax ? "items-start" : "items-center",
            "overflow-auto hide-scrollbar",
            isExiting ? "pointer-events-none" : "pointer-events-auto", // 根据退出状态控制指针事件
          ])}
          onClick={() => {
            LightboxState.close();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              LightboxState.close();
            }
          }}
        >
          <motion.img
            key={currentImg}
            initial={{ scale: 0.75, filter: "blur(24px)" }}
            animate={{
              scale: 1,
              filter: "blur(0px)",
            }}
            transition={{
              scale: { type: "spring", visualDuration: 0.3, bounce: 0.5 },
            }}
            exit={{ scale: 0.75, filter: "blur(24px)" }}
            className={cn([
              "my-4",
              !zoomable
                ? "cursor-default"
                : toMax
                ? "cursor-zoom-out"
                : "cursor-zoom-in",
            ])}
            layout
            src={currentImg}
            alt=""
            style={{
              maxWidth: zoomable && toMax ? "98%" : "90%",
              maxHeight: zoomable && toMax ? "none" : "90%",
            }}
            onClick={(e) => {
              setToMax(!toMax);
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                LightboxState.close();
              }
            }}
            onLoad={(e) => {
              const img = e.currentTarget;
              img.naturalHeight > img.height &&
              img.naturalHeight / img.naturalWidth > 0.5
                ? setZoomable(true)
                : setZoomable(false);
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
