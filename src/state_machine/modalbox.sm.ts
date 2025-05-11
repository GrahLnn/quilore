import { useSelector } from "@xstate/react";
import { assign, createActor, createMachine } from "xstate";
import { createStateAndSignals } from "./core";
import { station } from "../subpub/buses";

const { State, Signal } = createStateAndSignals({
  states: ["closed", "opening", "opened", "closing"] as const,
  signals: ["OPEN", "CLOSE", "EXIT"] as const,
});

export function newModalMachine<TPayload = unknown>(name: string) {
  const modalMachine = createMachine(
    {
      id: name,
      initial: State.closed,
      context: {
        payload: null as TPayload | null,
      },
      states: {
        [State.closed]: {
          on: {
            [Signal.open.into()]: {
              target: State.opening,
              actions: "setPayload",
            },
          },
        },
        [State.opening]: {
          after: {
            10: State.opened,
          },
        },
        [State.opened]: {
          on: {
            [Signal.close.into()]: State.closing,
          },
        },
        [State.closing]: {
          after: {
            200: State.closed,
          },
        },
      },
    },
    {
      actions: {
        setPayload: assign({
          payload: ({ event }) => {
            if (event && typeof event === "object" && "data" in event) {
              return event.data as TPayload;
            }
            return null;
          },
        }),
      },
    }
  );

  const modalActor = createActor(modalMachine);
  modalActor.start();

  function open(payload?: TPayload) {
    modalActor.send({ type: Signal.open.into(), data: payload });
  }

  function close() {
    modalActor.send(Signal.close);
    station.curExpandImg.set(null);
  }

  function useModalState() {
    return useSelector(modalActor, (state) => ({
      isOpen: state.matches(State.opened) || state.matches(State.opening),
      isExiting: state.matches(State.closing),
      payload: state.context.payload,
    }));
  }

  return { open, close, useModalState };
}
