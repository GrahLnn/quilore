import { matchable } from "@/lib/matchable";
import { useSelector } from "@xstate/react";
import { createActor, createMachine } from "xstate";
import { createStateAndSignals } from "./core";
import { useMemo } from "react";

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

const languageActor = createActor(languageMachine);
languageActor.start();

export function toggleLanguageMode(): void {
  languageActor.send(Signal.toggle);
}

export function useLanguageState() {
  const state = useSelector(languageActor, (state) => state.value);
  return useMemo(() => matchable(state as keyof typeof State), [state]);
}
export { State as LanguageState };
