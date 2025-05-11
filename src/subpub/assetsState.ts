import { createBus } from "./core";

export const {
  watch: useAssetState,
  set: setAssetState,
  get: getAssetState,
} = createBus<Map<string, boolean>>(new Map());
