import { createMatchAtom, createAtom, createDerivedAtom } from "./core";
import {
  platform as OSplatform,
  type Platform as OSPlatform,
} from "@tauri-apps/plugin-os";
import { Guide, Page, Platform, CenterToolProp, CookieItem, TwitterPage } from "./type";

export const station = {
  postsTitle: createAtom<string>(""),
  mainFlex: createAtom<boolean>(false),
  saveDir: createAtom<string | null>(null),
  allowBarInteraction: createAtom<boolean>(true),
  curExpandImg: createAtom<string | null>(null),
  intractID: createAtom<string | null>(null),
  centerTool: createAtom<CenterToolProp | null>(null),
  assetState: createAtom<Map<string, boolean>>(new Map()),
  guideCookie: createAtom<CookieItem[]>([]),
  scanCheck: createAtom<boolean>(false),
  // blurPage: createAtom<boolean>(false),
  isScrollingFast: createAtom<boolean>(false),
  scrollVelocity: createAtom<number>(0),
  schedulerPause: createAtom<boolean>(false),
  startImport: createAtom<boolean>(false),
  isCookieSet: createAtom<boolean>(true),

  guide: createMatchAtom<Guide>(Guide.SetSaveDir),
  page: createMatchAtom<Page>(Page.Main),
  platform: createMatchAtom<Platform>(Platform.Twitter),
  twitter: createMatchAtom<TwitterPage>(TwitterPage.Pre),
  os: createMatchAtom<OSPlatform>(OSplatform() as OSPlatform),
};

export const driveStation = {
  isTooFast: createDerivedAtom(
    (get) => Math.abs(get(station.scrollVelocity.atom)) > 8000
  ),
};

export const sizeMap: Map<string, [number, number]> = new Map();
