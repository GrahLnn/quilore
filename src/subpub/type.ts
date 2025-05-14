export enum Guide {
  SetSaveDir = "SetSaveDir",
  AddPlatform = "AddPlatform",
}

export enum Platform {
  Twitter = "Twitter",
}
export enum Page {
  Welcome = "Welcome",
  Main = "Main",

  NotFound = "NotFound",
}

export interface CenterToolProp {
  key: string;
  node: React.ReactNode;
}

export interface CookieItem {
  platform: "Twitter";
  cookie: string;
}
