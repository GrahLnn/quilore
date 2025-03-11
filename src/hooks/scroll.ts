import { useEffect, useRef } from "react";
import { scrollbar } from "../components/scrollbar";
import throttle from "lodash/throttle";

function useScrollYRef() {
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

export { useScrollYRef };
