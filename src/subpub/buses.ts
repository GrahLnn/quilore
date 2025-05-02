import { createBus } from "./core";
import { type Matchable, matchable } from "@/lib/matchable";

export const station = {
  postsTitle: createBus<string>(""),
  mainFlex: createBus<boolean>(false),
  saveDir: createBus<string | null>(null),
};
