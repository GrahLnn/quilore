import { convertFileSrc } from "@tauri-apps/api/core";

export function getSrc(path: string | null): string | null {
  return path ? convertFileSrc(path) : null;
}
