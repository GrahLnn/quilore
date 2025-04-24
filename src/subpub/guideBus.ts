import { createBus } from "./core";
import { type Matchable, matchable } from "@/lib/matchable";

export enum Guide {
  SetSaveDir = "SetSaveDir",
  AddPlatform = "AddPlatform",
}

export const {
  useValue: useGuide,
  setValue: setRawGuide,
  getValue: getRawGuide,
} = createBus<Matchable<Guide>>(matchable(Guide.SetSaveDir));

export const setGuide = (guide: Guide) => setRawGuide(matchable(guide));

export const getGuide = (): Guide => getRawGuide().value;
