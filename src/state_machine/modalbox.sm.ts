import { useSelector } from "@xstate/react";
import { assign, createActor, createMachine } from "xstate";
import { createStateAndSignals } from "./core";

const { State, Signal } = createStateAndSignals({
  states: ["closed", "opening", "opened", "closing"] as const,
  signals: ["OPEN", "CLOSE", "EXIT"] as const,
});

export type ModalController<TPayload = unknown> = {
  open: (payload?: TPayload) => void;
  close: () => void;
  exit: () => void;
  useModalState: () => {
    isOpen: boolean;
    isExiting: {
      state: boolean;
      data: TPayload | null;
    };
    isClosed: boolean;
    payload: TPayload | null;
  };
};

export function newModalMachine<TPayload = unknown>(
  name: string
): ModalController<TPayload> {
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
          on: {
            [Signal.exit.into()]: State.closed,
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
  }

  function exit() {
    modalActor.send(Signal.exit);
  }

  function useModalState() {
    return useSelector(modalActor, (state) => ({
      isOpen: state.matches(State.opened) || state.matches(State.opening),
      isExiting: {
        state: state.matches(State.closing),
        data: state.context.payload,
      },
      isClosed: state.matches(State.closed),
      payload: state.context.payload,
    }));
  }

  return { open, close, exit, useModalState };
}
