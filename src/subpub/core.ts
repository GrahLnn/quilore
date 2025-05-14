import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { matchable, Matchable } from "@/lib/matchable";

export function createAtom<T>(initialValue: T) {
  const atomm = atom<T>(initialValue);

  function useSee() {
    return useAtomValue(atomm);
  }

  function useSet() {
    return useSetAtom(atomm);
  }

  function get() {
    return atomm;
  }

  function useAll() {
    return useAtom(atomm);
  }

  return {
    atom: atomm,
    useSee,
    useSet,
    useAll,
    get,
  };
}

export function createMatchAtom<T extends string | number>(initialValue: T) {
  const inner = createAtom<Matchable<T>>(
    matchable(initialValue) as Matchable<T>
  );

  return {
    atom: inner.atom,
    useAll: () => {
      const [raw, setRaw] = inner.useAll();
      return [raw, (v: T) => setRaw(matchable(v))];
    },
    useSee: () => inner.useSee(),
    useSet: () => {
      const set = inner.useSet();
      return (value: T) => set(matchable(value));
    },
    get: inner.get,
  };
}
