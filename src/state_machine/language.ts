import { matchable } from "@/lib/matchable";
import { useSelector } from "@xstate/react";
import { createActor, createMachine } from "xstate";
import { createStateAndSignals } from "./core";

const { State, Signal } = createStateAndSignals({
  states: ["original", "translated"],
  signals: ["TOGGLE"],
});

export const languageMachine = createMachine({
  id: "language",
  initial: State.original,
  states: {
    [State.original]: {
      on: {
        [Signal.toggle.into()]: {
          target: State.translated,
        },
      },
    },
    [State.translated]: {
      on: {
        [Signal.toggle.into()]: {
          target: State.original,
        },
      },
    },
  },
});

// 创建一个单例actor，以便在整个应用中共享状态
const languageActor = createActor(languageMachine);
// 启动actor
languageActor.start();

/**
 * 切换语言模式
 */
export function toggleLanguageMode(): void {
  languageActor.send(Signal.toggle);
}

/**
 * 获取当前语言模式
 * @returns 当前语言模式
 */
export function useLanguageState() {
  const state = useSelector(languageActor, (state) => state.value);
  return matchable(state as (typeof State)[keyof typeof State]);
}

export { State as LanguageState };
