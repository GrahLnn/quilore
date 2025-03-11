import { useEffect, useState, type RefObject } from "react";
import throttle from "lodash/throttle";

/**
 * 检查元素是否在视口内
 * @param el 目标元素
 * @param offset 预加载偏移量（默认300px）
 * @returns 是否在视口内的状态
 */
const isInView = (el: HTMLElement | null, offset = 300) => {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  return (
    rect.top - offset < windowHeight &&
    rect.bottom + offset > 0 &&
    rect.left < windowWidth &&
    rect.right > 0
  );
};

/**
 * 自定义 Hook：根据 ref 和偏移量判断元素是否在视口内
 * @param ref 目标元素的 ref
 * @param offset 预加载偏移量
 */
const useElementInView = (ref: RefObject<HTMLElement | null>, offset = 300) => {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const checkInView = () => {
      setInView(isInView(ref.current, offset));
    };

    const throttledCheck = throttle(checkInView, 50);
    window.addEventListener("scroll", throttledCheck);
    window.addEventListener("resize", throttledCheck);
    // 先执行一次判断
    throttledCheck();

    return () => {
      window.removeEventListener("scroll", throttledCheck);
      window.removeEventListener("resize", throttledCheck);
      throttledCheck.cancel();
    };
  }, [ref, offset]);

  return inView;
};

export default useElementInView;
