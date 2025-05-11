import { createBus } from "./core";
import { type Matchable, matchable } from "@/lib/matchable";
import { platform, type Platform } from "@tauri-apps/plugin-os";

const os = platform();

export const {
  watch: useOSName,
  set: setRawOSName,
  get: getRawOSName,
} = createBus<Matchable<Platform>>(matchable(os));

export const setOSName = (os: Platform) => setRawOSName(matchable(os));

export const getOSName = (): Platform => getRawOSName().value;
