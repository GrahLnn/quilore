import { createBus } from "./core";
import { type Matchable, matchable } from "@/lib/matchable";

export const station = {
  postsTitle: createBus<string>(""),
};
