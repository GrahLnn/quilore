import { cn } from "@/lib/utils";
import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-client";
import { useEffect, useState } from "react";
import { type LightboxPayload, LightboxState } from "./lightboxObserver";

export function Lightbox() {
  const [state, setState] = useState<LightboxPayload>({
    images: [],
    currentIndex: 0,
    isOpen: false,
  });
  const [toMax, setToMax] = useState(false);
  const [zoomable, setZoomable] = useState(false);
  const [imgState, setImgState] = useState<"normal" | "max">("normal");
  // 订阅全局 LightboxState
  useEffect(() => {
    const unsubscribe = LightboxState.subscribe((data) => {
      setState(data);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (zoomable && toMax) {
      setImgState("max");
    } else {
      setImgState("normal");
    }
  }, [zoomable, toMax]);

  useEffect(() => {
    if (state.isOpen) {
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
          animate={{ backdropFilter: "blur(24px)", opacity: 1 }}
          exit={{ backdropFilter: "blur(0px)", opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn([
            "fixed top-0 left-0 w-screen h-screen z-90 select-none pointer-events-auto pt-8",
            "flex justify-center ",
            zoomable && toMax ? "items-start" : "items-center",
            "overflow-auto hide-scrollbar",
          ])}
          onClick={() => LightboxState.close()}
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
              //   maxWidth: zoomable && toMax ? "98%" : "90%",
              //   maxHeight: zoomable && toMax ? "none" : "90%",
              //   transition: { duration: 0.3 },
            }}
            // animate={imgState}
            // variants={{
            //   normal: {
            //     scale: 1,
            //     filter: "blur(0px)",
            //     maxWidth: "90%",
            //     maxHeight: "90%",
            //     transition: { duration: 0.3 },
            //   },
            //   max: {
            //     scale: 1,
            //     filter: "blur(0px)",
            //     // maxWidth: "98%",
            //     // maxHeight: "none",
            //     transition: { duration: 0.3 },
            //   },
            // }}
            exit={{ scale: 0.75, filter: "blur(24px)" }}
            className="my-4 lightbox-shadow"
            // transition={{ duration: 0.3 }}
            src={currentImg}
            alt=""
            style={{
              maxWidth: zoomable && toMax ? "98%" : "90%",
              maxHeight: zoomable && toMax ? "none" : "90%",
              cursor: !zoomable ? "default" : toMax ? "zoom-out" : "zoom-in",
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
