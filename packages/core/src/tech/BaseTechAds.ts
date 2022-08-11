import { WebRTCPlayer } from '@eyevinn/webrtc-player';
import BaseTech, { IBaseTechOptions } from './BaseTech';
import { CSAIManager } from "@eyevinn/csai-manager";

export default class BaseTechAds extends BaseTech {
    private csaiManager: CSAIManager;
    
    constructor(opts: IBaseTechOptions) {
      super(opts);
      if (opts.ads?.displayAds) {
        this.csaiManager = new CSAIManager({
          contentVideoElement: opts.video,
          vmapUrl: opts.ads.vmapUrl,
          autoplay: opts.video.autoplay,
        });
        opts.video.addEventListener('ended', () => {
          this.csaiManager.destroy();
        });
      }
    }
  
    destroy() {
      super.destroy();
    }
  }
  