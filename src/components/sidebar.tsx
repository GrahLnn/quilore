import { station } from "../subpub/buses";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { crab } from "../cmd/commandAdapter";
import { cn } from "@/lib/utils";
import { createAtom } from "../subpub/core";
import { icons } from "../assets/icons";
import { useIsWindowFocus } from "../state_machine/windowFocus";

const sidebar_station = {
  open: createAtom<boolean>(false),
};

export function useSidebarAutoClose(
  open: boolean,
  setSidebarOpen: (open: boolean) => void
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canOpenSidebar = station.canOpenSidebar.useSee();
  const isWindowFocused = useIsWindowFocus();

  useEffect(() => {
    function poll() {
      timerRef.current = setInterval(async () => {
        const r = await crab.getMouseAndWindowPosition();
        r.tap((info) => {
          const {
            rel_x: x,
            rel_y: y,
            window_height: height,
            pixel_ratio: ratio,
          } = info;

          const maxX = (240 + 16) * ratio;

          const shouldClose =
            x < -300 ||
            y < 40 ||
            y > height - 15 ||
            x > maxX ||
            !canOpenSidebar;

          const shouldOpen =
            x > 0 &&
            x < 40 &&
            y > 40 &&
            y < height &&
            canOpenSidebar &&
            isWindowFocused;

          if (shouldClose) setSidebarOpen(false);
          else if (shouldOpen) setSidebarOpen(true);
        });
      }, 30);
    }

    poll();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, setSidebarOpen, canOpenSidebar, isWindowFocused]);
}

interface SidebarItemProps {
  text: string;
}

function SidebarItem({ text }: SidebarItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const setCat = station.categorys.useSet();
  const [curChoose, setCurChoose] = station.currentChooseCat.useAll();
  const setNeedRefresh = station.needRefresh.useSet();
  const [catPage, setCatPage] = station.catPage.useAll();

  return (
    <div
      key={text}
      className={cn([
        "p-2 rounded-md cursor-pointer hover:bg-accent/60 select-none",
        "text-sm font-semibold flex items-center justify-between",
        catPage === text && "bg-accent/60",
      ])}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (catPage === text) return;
        setNeedRefresh(true);
        setCatPage(text);
      }}
    >
      {text}
      {isHovered && (
        <div
          className={cn([
            "p-1 rounded",
            "dark:bg-[#262626] hover:dark:bg-[#373737] bg-[#e5e5e5] hover:bg-[#d4d4d4]",
            "transition",
          ])}
          onClick={(e) => {
            e.stopPropagation();
            crab.deleteCollection(text).then(() => {
              if (curChoose === text) {
                setCurChoose(null);
              }
              crab.allCollection().then((v) => {
                v.tap((v) => {
                  setCat(v);
                });
              });
              setCatPage(null);
              setNeedRefresh(true);
            });
          }}
        >
          <icons.xmark size={12} />
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = sidebar_station.open.useAll();
  const cats = station.categorys.useSee();
  useSidebarAutoClose(open, setOpen);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="sidebar"
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{
            type: "linear",
            duration: 0.1,
          }}
          className={cn([
            "fixed top-6 bottom-1 left-1 w-60 z-[1000]",
            "shadow-lg rounded-md border border-[#f5f5f5] dark:border-[#262626]",
            "bg-popover/80 backdrop-filter backdrop-blur-[16px]",
          ])}
        >
          {cats.length > 0 ? (
            <div className="p-2 flex flex-col gap-2">
              {cats.map((cat) => (
                <SidebarItem key={cat} text={cat} />
              ))}
            </div>
          ) : (
            <div className="p-2 flex flex-col items-center justify-center">
              <div className="p-2 rounded-md text-sm font-semibold select-none cursor-default opacity-70">
                No Collection yet
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
