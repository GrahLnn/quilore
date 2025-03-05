// index.ts
import { LightboxState } from "./lightboxObserver";

/**
 * 模仿 sonner 的 toast(...) 效果
 * 这里是对外暴露的全局 Lightbox API
 */
export const box = {
  open(images: string[], startIndex = 0) {
    LightboxState.open(images, startIndex);
  },
  close() {
    LightboxState.close();
  },
  next() {
    LightboxState.goNext();
  },
  prev() {
    LightboxState.goPrev();
  },
};
