import { createBus } from "./core";

export interface CenterToolProp {
    key: string,
    node: React.ReactNode
}

export const {
  watch: useCenterTool,
  set: setCenterTool,
  get: getCenterTool,
} = createBus<CenterToolProp | null>(null);
