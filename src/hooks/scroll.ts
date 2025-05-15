import { useEffect, useRef } from "react";
import { scrollbar } from "../components/scrollbar";
import throttle from "lodash/throttle";
import { station } from "../subpub/buses";

export function useScrollYRef() {
  const scrollYRef = useRef(window.scrollY);
  useEffect(() => {
    const handleScroll = throttle(() => {
      scrollYRef.current = window.scrollY;
      // 例如可以调用一些不需要重绘的逻辑：
      scrollbar.updateScrollTop(scrollYRef.current);
    }, 100);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (handleScroll.cancel) {
        handleScroll.cancel();
      }
    };
  }, []);
  return scrollYRef;
}

// export function useScrollVelocity() {
//   const setVelocity = station.scrollVelocity.useSet();
//   const lastScroll = useRef(window.scrollY);
//   const lastTime = useRef(Date.now());
//   const ticking = useRef(false);
//   const zeroTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

//   useEffect(() => {
//     const onScroll = () => {
//       if (!ticking.current) {
//         requestAnimationFrame(() => {
//           const now = Date.now();
//           const y = window.scrollY;
//           const v = (y - lastScroll.current) / (now - lastTime.current + 1e-9);
//           setVelocity(v * 1000); // px/s
//           lastScroll.current = y;
//           lastTime.current = now;
//           ticking.current = false;

//           // 每次滚动，重置归零定时器
//           if (zeroTimer.current) clearTimeout(zeroTimer.current);
//           zeroTimer.current = setTimeout(() => {
//             setVelocity(0); // 超时没滚动就归零
//           }, 80); // 80ms可根据实际需要调整（太短会闪烁，太长会不灵敏）
//         });
//         ticking.current = true;
//       }
//     };

//     window.addEventListener("scroll", onScroll, { passive: true });
//     return () => {
//       window.removeEventListener("scroll", onScroll);
//       if (zeroTimer.current) clearTimeout(zeroTimer.current);
//     };
//   }, [setVelocity]);
// }