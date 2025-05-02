import { createBus } from "./core";

export const {
  useValue: useAssetState,
  setValue: setAssetState,
  getValue: getAssetState,
} = createBus<Map<string, boolean>>(new Map());
