import { useSelector } from "@xstate/react";
import { createActor, createMachine } from "xstate";
import { createStateAndSignals } from "./core";
import { matchable } from "@/lib/matchable";

// 定义状态和信号
const { State, Signal } = createStateAndSignals({
  states: ["normal", "ghost", "holder", "none"] as const,
  signals: ["toGhost", "toNormal", "toHolder", "toNone"] as const,
});

// 通用状态跳转规则
const transitions = {
  [Signal.tonormal.into()]: State.normal,
  [Signal.toghost.into()]: State.ghost,
  [Signal.toholder.into()]: State.holder,
  [Signal.tonone.into()]: State.none,
};

// 构造所有状态通用的跳转表
const states = Object.fromEntries(
  Object.values(State).map((s) => [
    s,
    {
      on: transitions,
    },
  ])
);

export function newBundimgMachine() {
  const bundimgMachine = createMachine({
    id: "bundimg",
    initial: State.normal,
    states,
  });

  const actor = createActor(bundimgMachine).start();

//   const senders = Object.fromEntries(
//     Object.entries(Signal).map(([key, signal]) => [
//       signal.into(), // like "toGhost"
//       () => actor.send(signal),
//     ])
//   ) as Record<string, () => void>;

  const useBundimgState = () =>
    matchable(useSelector(actor, (state) => state.value as keyof typeof State));

  return {
    toGhost: () => actor.send(Signal.toghost),
    toNormal: () => actor.send(Signal.tonormal),
    toHolder: () => actor.send(Signal.toholder),
    toNone: () => actor.send(Signal.tonone),
    useBundimgState,
  };
}
