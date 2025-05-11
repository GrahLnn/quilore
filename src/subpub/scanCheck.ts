import { createBus } from "./core";

export const {
  watch: useScanCheck,
  set: setScanCheck,
  get: getScanCheck,
} = createBus<boolean>(false);
