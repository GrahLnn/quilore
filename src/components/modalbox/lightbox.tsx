import { newModalMachine } from "@/src/state_machine/modalbox.sm";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toggleVisibility } from "@/src/state_machine/barVisible";
import { convertFileSrc } from "@tauri-apps/api/core";

export type LightboxPayload = {
  images: string[];
  currentIndex: number;
};

export const lightboxMachine = newModalMachine<LightboxPayload>("lightbox");

export const { open: openLightbox, close: closeLightbox } = lightboxMachine;

export function Lightbox() {
  const { isExiting, isOpen, payload } = lightboxMachine.useModalState();
  const [toMax, setToMax] = useState(false);
  const [zoomable, setZoomable] = useState(false);

  const images = payload?.images || [];
  const currentIndex = payload?.currentIndex || 0;
  const currentImg = images[currentIndex];

  // 页面滚动控制
  useEffect(() => {
    if (isOpen) {
      toggleVisibility(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setToMax(false);
    }
    return () => {
      document.body.style.pointerEvents = "";
    };
  }, [isOpen]);

  // 退出时恢复 bar
  useEffect(() => {
    if (isExiting) {
      toggleVisibility(true);
    }
  }, [isExiting]);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
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
            pointerEvents: "none",
          }}
          className={cn([
            "fixed top-0 left-0 w-screen h-screen z-100 select-none pt-8",
            "flex justify-center ",
            zoomable && toMax ? "items-start" : "items-center",
            "overflow-auto hide-scrollbar",
            isExiting ? "pointer-events-none" : "pointer-events-auto",
          ])}
          onClick={() => lightboxMachine.close()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              lightboxMachine.close();
            }
          }}
        >
          <motion.img
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
            src={convertFileSrc(currentImg)}
            style={{
              maxWidth: zoomable && toMax ? "98%" : "90%",
              maxHeight: zoomable && toMax ? "none" : "90%",
            }}
            onClick={(e) => {
              setToMax(!toMax);
              e.stopPropagation();
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
