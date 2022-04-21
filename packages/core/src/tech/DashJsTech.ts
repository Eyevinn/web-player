import { MediaPlayer, MediaPlayerClass } from 'dashjs';
import { PlayerEvent } from '../util/constants';
import BaseTech, { IBaseTechOptions } from './BaseTech';
import WebRTCTech from './WebRTCTech';

export default class MssPlayer extends BaseTech {
  private mediaPlayer: MediaPlayerClass;
  private webRTCTech?: WebRTCTech;

  private webRTCPeriod?: any;

  constructor(opts: IBaseTechOptions) {
    super(opts);
    this.mediaPlayer = MediaPlayer().create();
    this.mediaPlayer.initialize();
    this.mediaPlayer.attachView(this.video);
  }

  private doRTCMagic(manifest: any) {
    const periods = manifest?.Period_asArray;
    if (periods.length === 1) {
      if (
        periods[0]['xlink:rel'] === 'urn:ietf:params:whip:eyevinn-wrtc-channel'
      ) {
        this.startWebRTC(periods[0]['xlink:href']);
      } else if (periods[0].AdaptationSet) {
        const rtcAdaptionSet = periods[0].AdaptationSet_asArray?.find(
          (adaptionSet) =>
            adaptionSet['xlink:rel'] ===
            'urn:ietf:params:whip:eyevinn-wrtc-channel'
        );
        if (rtcAdaptionSet) {
          this.startWebRTC(rtcAdaptionSet['xlink:href']);
        }
      }
    } else {
      let start = 0;
      const rtcPeriod = periods?.find((period) => {
        const isRtcChannel =
          period['xlink:rel'] === 'urn:ietf:params:whip:eyevinn-wrtc-channel';
        if (!isRtcChannel) {
          start += period.duration;
        }
        return isRtcChannel;
      });

      this.webRTCPeriod = {
        start,
        channel: rtcPeriod['xlink:href'],
      };
    }
  }

  private startWebRTC(channel) {
    if (channel) {
      this.mediaPlayer.reset();
      this.setDefaultState();

      this.webRTCTech = new WebRTCTech({
        video: this.video,
      });
      this.webRTCTech.load(channel);
      this.webRTCTech.once(PlayerEvent.LOADED_METADATA, () =>
        this.webRTCTech.play()
      );
    }
  }

  public load(src: string): Promise<void> {
    super.setDefaultState();
    return new Promise((resolve, reject) => {
      this.mediaPlayer.attachSource(src);
      this.mediaPlayer.on(MediaPlayer.events.MANIFEST_LOADED, ({ data }) => {
        this.doRTCMagic(data);
        resolve();
      });
      this.mediaPlayer.on(MediaPlayer.events.ERROR, (ev) => {
        reject(`Failed to load Mss Player`);
      });
    });
  }

  onTimeUpdate() {
    if (
      this.webRTCPeriod &&
      this.video.currentTime >= this.webRTCPeriod?.start - 1
    ) {
      this.startWebRTC(this.webRTCPeriod.channel);
      this.webRTCPeriod = null;
      return;
    }
    super.onTimeUpdate();
  }

  public get isLive() {
    if (this.webRTCTech) {
      return true;
    }
    return this.mediaPlayer.isDynamic();
  }

  public destroy() {
    if (this.mediaPlayer) {
      this.mediaPlayer.reset();
      this.mediaPlayer = null;
    }
    super.destroy();
  }
}
