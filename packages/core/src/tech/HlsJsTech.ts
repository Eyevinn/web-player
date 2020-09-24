import BaseTech, { IBaseTechOptions, PlaybackState } from './BaseTech';
import Hls from 'hls.js';

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

    this.hls.on(
      Hls.Events.AUDIO_TRACK_SWITCHED,
      (this.onAudioTrackChange = this.onAudioTrackChange.bind(this))
    );
  }

  load(src: string): Promise<void> {
    if (this.state.playbackState !== PlaybackState.IDLE) {
      this.stop();
    }
    return new Promise((resolve) => {
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

  get audioTrack() {
    return this.hls?.audioTrack?.toString();
  }

  set audioTrack(id) {
    if (this.hls) {
      this.hls.audioTrack = id;
    }
  }

  get audioTracks() {
    console.log(this.hls?.audioTrack);
    return (
      this.hls?.audioTracks.map((audioTrack) => ({
        id: audioTrack.id,
        label: audioTrack.name,
        language: audioTrack.lang,
        enabled: this.audioTrack === audioTrack.id.toString(),
      })) || []
    );
  }

  destroy() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    super.destroy();
  }
}
