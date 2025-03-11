export type LightboxPayload = {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
};

/**
 * 模仿 Sonner 里的 Observer，用于发布/订阅 Lightbox 状态
 */
class LightboxObserver {
  private subscribers: Array<(data: LightboxPayload) => void> = [];

  // 全局缓存的状态
  private state: LightboxPayload = {
    images: [],
    currentIndex: 0,
    isOpen: false,
  };

  subscribe = (callback: (data: LightboxPayload) => void) => {
    this.subscribers.push(callback);
    // 立即推送当前状态
    callback(this.state);

    // 返回一个取消订阅的函数
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    };
  };

  private publish = (data: Partial<LightboxPayload>) => {
    this.state = { ...this.state, ...data };
    for (const subscriber of this.subscribers) {
      subscriber(this.state);
    }
  };

  open(images: string[], startIndex = 0) {
    this.publish({
      images,
      currentIndex: startIndex,
      isOpen: true,
    });
  }

  close() {
    this.publish({ isOpen: false });
  }

  goNext() {
    const { currentIndex, images } = this.state;
    if (currentIndex < images.length - 1) {
      this.publish({ currentIndex: currentIndex + 1 });
    }
    // 如果想循环轮播，可改写为:
    // this.publish({ currentIndex: (currentIndex + 1) % images.length })
  }

  goPrev() {
    const { currentIndex } = this.state;
    if (currentIndex > 0) {
      this.publish({ currentIndex: currentIndex - 1 });
    }
    // 如果想循环，可自己改写
  }
}

export const LightboxState = new LightboxObserver();
