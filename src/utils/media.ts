export function clearVideo(videoEl: HTMLVideoElement) {
  if (!videoEl) return;

  // 1. 停止播放，重置时间
  videoEl.pause();
  videoEl.currentTime = 0;

  // 2. 解除所有可能的来源
  videoEl.removeAttribute("src");
  videoEl.src = "";
  if ("srcObject" in videoEl) {
    videoEl.srcObject = null;
  }

  // 3. 移除所有监听事件，防止状态残留
  videoEl.onabort = null;
  videoEl.oncanplay = null;
  videoEl.oncanplaythrough = null;
  videoEl.ondurationchange = null;
  videoEl.onemptied = null;
  videoEl.onended = null;
  videoEl.onerror = null;
  videoEl.onloadeddata = null;
  videoEl.onloadedmetadata = null;
  videoEl.onloadstart = null;
  videoEl.onpause = null;
  videoEl.onplay = null;
  videoEl.onplaying = null;
  videoEl.onprogress = null;
  videoEl.onratechange = null;
  videoEl.onseeked = null;
  videoEl.onseeking = null;
  videoEl.onstalled = null;
  videoEl.onsuspend = null;
  videoEl.ontimeupdate = null;
  videoEl.onvolumechange = null;
  videoEl.onwaiting = null;

  // 4. 重置视频属性
  videoEl.autoplay = false;
  videoEl.controls = false;
  videoEl.crossOrigin = null;
  videoEl.defaultMuted = false;
  videoEl.defaultPlaybackRate = 1.0;
  videoEl.loop = false;
  videoEl.muted = false;
  videoEl.playbackRate = 1.0;
  videoEl.playsInline = false;
  videoEl.preload = "none"; // 防止视频重新加载
  videoEl.poster = "";
  videoEl.volume = 1.0;

  // 5. 清除视频轨道
  if (videoEl.textTracks) {
    for (let i = 0; i < videoEl.textTracks.length; i++) {
      videoEl.textTracks[i].mode = "disabled";
    }
  }

  // 处理audioTracks (如果浏览器支持)
  // 使用类型保护和索引签名来处理可能存在的属性
  const video = videoEl as HTMLVideoElement & {
    audioTracks?: {
      length: number;
      [index: number]: { enabled: boolean };
    };
  };
  
  if (video.audioTracks && video.audioTracks.length > 0) {
    for (let i = 0; i < video.audioTracks.length; i++) {
      video.audioTracks[i].enabled = false;
    }
  }

  // 处理videoTracks (如果浏览器支持)
  const videoWithTracks = videoEl as HTMLVideoElement & {
    videoTracks?: {
      length: number;
      [index: number]: { selected: boolean };
    };
  };
  
  if (videoWithTracks.videoTracks && videoWithTracks.videoTracks.length > 0) {
    for (let i = 0; i < videoWithTracks.videoTracks.length; i++) {
      videoWithTracks.videoTracks[i].selected = false;
    }
  }

  // 6. 释放 `MediaStream` 资源 (如果有)
  if (videoEl.srcObject instanceof MediaStream) {
    // biome-ignore lint/complexity/noForEach: <explanation>
    videoEl.srcObject.getTracks().forEach((track) => track.stop());
    videoEl.srcObject = null;
  }

  // 7. 触发重新加载，确保清理生效
  videoEl.load();
}

export const clearImg = (img: HTMLImageElement) => {
    img.src = "";
  };