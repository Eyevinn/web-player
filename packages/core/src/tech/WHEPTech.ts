import { WebRTCPlayer } from '@eyevinn/webrtc-player';
import { IWebPlayerOptions } from '../WebPlayer';
import BaseTech from './BaseTech';

export default class WHEPTech extends BaseTech {
  private player: WebRTCPlayer;

  constructor(opts: IWebPlayerOptions) {
    super(opts);
    this.player = new WebRTCPlayer({
      video: this.video,
      type: "whep",
      iceServers: opts.iceServers,
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
