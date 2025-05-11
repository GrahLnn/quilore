import { createBus } from "./core";

// 定义 Cookie 对象的接口
export interface CookieItem {
  platform: "Twitter";
  cookie: string;
}

const { watch: useGuideC, set: setGuideC, get: getGuideC } = createBus<CookieItem[]>([]);

function viewGuideC() {
  const v = useGuideC();
  return v.length > 0;
}

export { setGuideC, viewGuideC, getGuideC, useGuideC };
