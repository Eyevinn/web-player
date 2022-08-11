import { WebRTCPlayer } from '@eyevinn/webrtc-player';
import BaseTech, { IBaseTechOptions } from './BaseTech';

export default class WHPPTech extends BaseTech {
  private player: WebRTCPlayer;

  constructor(opts: IBaseTechOptions) {
    super(opts);
    this.player = new WebRTCPlayer({
      video: this.video,
      type: "se.eyevinn.whpp",
      vmapUrl: opts.ads?.displayAds ? opts.ads?.vmapUrl : undefined,
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
