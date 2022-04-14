import { WebRTCPlayer } from '@eyevinn/webrtc-player';
import BaseTech, { IBaseTechOptions } from './BaseTech';

export default class WebRTCTech extends BaseTech {
  private player: WebRTCPlayer;

  constructor(opts: IBaseTechOptions) {
    super(opts);
    this.player = new WebRTCPlayer({
      video: this.video,
      // hardcoded to EYEVINN_WEBRTC_CHANNEL for now.
      type: "se.eyevinn.webrtc"
    });
  }

  load(src: string): Promise<void> {
    super.setDefaultState({
      isSeekable: false
    });
    return this.player.load(new URL(src));
  }

  onTimeUpdate() {
    // no-op 
  }

  get isLive() {
    return true
  }

  destroy() {
    this.player.destroy();
    super.destroy();
  }
}
