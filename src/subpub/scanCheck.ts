import { createBus } from "./core";

export const {
  useValue: useScanCheck,
  setValue: setScanCheck,
  getValue: getScanCheck,
} = createBus<boolean>(false);
