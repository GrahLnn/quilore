import { createBus } from "./core";

export interface CenterToolProp {
    key: string,
    node: React.ReactNode
}

export const {
  useValue: useCenterTool,
  setValue: setCenterTool,
  getValue: getCenterTool,
} = createBus<CenterToolProp | null>(null);
