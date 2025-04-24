import { createBus } from "./core";

// 定义 Cookie 对象的接口
export interface CookieItem {
  platform: string;
  cookie: string;
}

const { useValue: useGuideC, setValue: setGuideC, getValue: getGuideC } = createBus<CookieItem[]>([]);

function viewGuideC() {
  const v = useGuideC();
  return v.length > 0;
}

export { setGuideC, viewGuideC, getGuideC, useGuideC };
