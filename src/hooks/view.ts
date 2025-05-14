import { useEffect, useState, type RefObject, useCallback } from "react"; // 引入 useCallback
import throttle from "lodash/throttle";

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

const useElementInView = (ref: RefObject<HTMLElement | null>, offset = 300) => {
  const [inView, setInView] = useState(() => isInView(ref.current, offset)); // 优化1: 初始状态直接计算一次

  // 优化2: 将 checkInView 移出 useEffect，并用 useCallback 包裹
  //         或者直接在 useEffect 内部定义，但确保 setInView 的条件判断
  const checkInViewCallback = useCallback(() => {
    const currentElement = ref.current;
    if (!currentElement) {
      // 如果元素不存在，可以根据需求决定 inView 的状态
      // 例如，如果元素消失了，应该视为不在视图内
      if (inView) setInView(false); // 只有当之前是 true 才更新为 false
      return;
    }

    const newValue = isInView(currentElement, offset);
    // 优化3: 只有当计算出的新值与当前状态值不同时，才调用 setInView
    if (newValue !== inView) {
      setInView(newValue);
    }
  }, [ref, offset, inView]); // inView 现在是依赖项，因为我们在回调中比较了它

  useEffect(() => {
    // 组件挂载后，先进行一次检查（节流版本或直接调用）
    // 使用节流可以避免初始快速滚动或调整大小导致的频繁检查
    const throttledCheck = throttle(checkInViewCallback, 50, {
      leading: true,
      trailing: true,
    });

    // 立即执行一次检查，确保初始状态正确
    // 如果初始状态在 useState 中已经通过 isInView(ref.current, offset) 设置，这里可能可以省略
    // 但如果初始 ref.current 可能为 null，则这里的检查更安全
    checkInViewCallback();

    window.addEventListener("scroll", throttledCheck, { passive: true }); // 添加 passive: true
    window.addEventListener("resize", throttledCheck, { passive: true }); // 添加 passive: true

    return () => {
      window.removeEventListener("scroll", throttledCheck);
      window.removeEventListener("resize", throttledCheck);
      throttledCheck.cancel(); // 清理节流函数
    };
  }, [ref, offset, checkInViewCallback]); // checkInViewCallback 作为依赖

  return inView;
};

export default useElementInView;
