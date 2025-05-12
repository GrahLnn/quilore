import { newModalMachine } from "@/src/state_machine/modalbox.sm";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, LayoutGroup } from "motion/react";
import { useEffect, useState } from "react";
import { toggleVisibility } from "@/src/state_machine/barVisible";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Asset } from "@/src/cmd/commands";
import { createPortal } from "react-dom";

export type LightboxPayload = {
  images: Asset[];
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
    if (isExiting.state) {
      toggleVisibility(true);
    }
  }, [isExiting.state]);

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        lightboxMachine.exit();
      }}
    >
      {isOpen && (
        <motion.div
          initial={{ backdropFilter: "blur(0px)" }}
          animate={{
            backdropFilter: "blur(24px)",
            transition: { duration: 0.3 },
          }}
          exit={{
            backdropFilter: "blur(0px)",

            pointerEvents: "none",
          }}
          className={cn([
            "fixed top-0 left-0 w-screen h-screen z-50 select-none pt-8",
            "flex justify-center",
            zoomable && toMax ? "items-start" : "items-center",
            "overflow-auto hide-scrollbar",
            isExiting.state ? "pointer-events-none" : "pointer-events-auto",
          ])}
          onClick={() => lightboxMachine.close()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              lightboxMachine.close();
            }
          }}
        >
          <motion.img
            initial={{ scale: 0.75 }}
            animate={{
              scale: 1,
              // filter: "blur(0px)",
            }}
            transition={{
              scale: { type: "spring", visualDuration: 0.3, bounce: 0.5 },
            }}
            // exit={{ filter: "blur(0px)" }}
            className={cn([
              "my-4",
              !zoomable
                ? "cursor-default"
                : toMax
                ? "cursor-zoom-out"
                : "cursor-zoom-in",
            ])}
            // layout
            layoutId={currentImg.name}
            key={currentImg.name}
            src={convertFileSrc(currentImg.path)}
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
