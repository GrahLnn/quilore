import { createMatchAtom, createAtom } from "./core";
import {
  platform as OSplatform,
  type Platform as OSPlatform,
} from "@tauri-apps/plugin-os";
import { Guide, Page, Platform, CenterToolProp, CookieItem } from "./type";

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

  guide: createMatchAtom<Guide>(Guide.SetSaveDir),
  page: createMatchAtom<Page>(Page.Main),
  platform: createMatchAtom<Platform>(Platform.Twitter),
  os: createMatchAtom<OSPlatform>(OSplatform() as OSPlatform),
};

export const sizeMap: Map<string, [number, number]> = new Map();
