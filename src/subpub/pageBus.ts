import { createBus } from "./core";
import { type Matchable, matchable } from "@/lib/matchable";

export enum Page {
  Welcome = "Welcome",
  Main = "Main",

  NotFound = "NotFound",
}

export const {
  watch: usePageName,
  set: setRawPageName,
  get: getRawPageName,
} = createBus<Matchable<Page>>(matchable(Page.Main));

// 提供更方便的设置页面方法，自动转换为 Matchable
export const setPageName = (page: Page) => setRawPageName(matchable(page));

// 提供获取原始页面值的方法
export const getPageName = (): Page => getRawPageName().value;
