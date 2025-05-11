import { createBus } from "./core";
import { type Matchable, matchable } from "@/lib/matchable";

export enum Platform {
  Twitter = "Twitter",
}

export const {
  watch: usePlatformName,
  set: setRawPlatformName,
  get: getRawPlatformName,
} = createBus<Matchable<Platform>>(matchable(Platform.Twitter));

// 提供更方便的设置页面方法，自动转换为 Matchable
export const setPlatformName = (page: Platform) => setRawPlatformName(matchable(page));

// 提供获取原始页面值的方法
export const getPlatformName = (): Platform => getRawPlatformName().value;

