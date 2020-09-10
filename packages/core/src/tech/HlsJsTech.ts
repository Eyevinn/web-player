import BaseTech, { IBaseTechOptions, PlaybackState } from "./BaseTech";
import Hls from "hls.js";

export default class HlsJsPlayer extends BaseTech {
  static isSupported() {
    return Hls.isSupported();
  }

  private hls: Hls;

  private isLiveFlag: boolean;

  constructor(opts: IBaseTechOptions) {
    super(opts);
    this.hls = new Hls();

    this.hls.attachMedia(this.video);
  }

  load(src: string): Promise<void> {
    if (this.state.playbackState !== PlaybackState.IDLE) {
      this.stop();
    }
    return new Promise(resolve => {
      this.hls.loadSource(src);
      this.hls.once(Hls.Events.LEVEL_LOADED, (event, data) => {
        this.isLiveFlag = data.details.live;
        resolve();
      });
    });
  }

  get isLive() {
    if (this.hls) {
      return this.isLiveFlag;
    } else {
      return isNaN(this.video.duration);
    }
  }

  destroy() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    super.destroy();
  }
}
