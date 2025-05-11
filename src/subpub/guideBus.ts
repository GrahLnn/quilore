import { createBus } from "./core";
import { type Matchable, matchable } from "@/lib/matchable";

export enum Guide {
  SetSaveDir = "SetSaveDir",
  AddPlatform = "AddPlatform",
}

export const {
  watch: useGuide,
  set: setRawGuide,
  get: getRawGuide,
} = createBus<Matchable<Guide>>(matchable(Guide.SetSaveDir));

export const setGuide = (guide: Guide) => setRawGuide(matchable(guide));

export const getGuide = (): Guide => getRawGuide().value;
