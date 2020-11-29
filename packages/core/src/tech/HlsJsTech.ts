import BaseTech, { IBaseTechOptions, PlaybackState } from './BaseTech';
import Hls from 'hls.js';
import { PlayerEvent } from '../util/constants';

const DEFAULT_CONFIG = {};

const LIVE_EDGE = 3; // seconds from liveEdge

export default class HlsJsTech extends BaseTech {
  static isSupported() {
    return Hls.isSupported();
  }

  private hls: Hls;

  private isLiveFlag: boolean;

  constructor(opts: IBaseTechOptions) {
    super(opts);
    this.hls = new Hls(DEFAULT_CONFIG);

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

  protected onTimeUpdate() {
    this.updateState({
      currentTime: this.currentTime,
      duration: this.duration,
      isAtLiveEdge: this.currentTime >= this.hls.liveSyncPosition - LIVE_EDGE,
    });
    this.emit(PlayerEvent.TIME_UPDATE, {
      currentTime: this.currentTime,
      duration: this.duration,
    });
  }

  get currentTime() {
    return this.video.currentTime;
  }

  set currentTime(newpos: number) {
    this.video.currentTime = this.isLive
      ? Math.min(newpos, this.hls.liveSyncPosition)
      : newpos;
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
      this.hls.audioTrack = parseInt(id);
    }
  }

  get audioTracks() {
    return (
      this.hls?.audioTracks.map((audioTrack) => ({
        id: audioTrack.id.toString(),
        label: audioTrack.name,
        language: audioTrack.lang,
        enabled: this.audioTrack === audioTrack.id.toString(),
      })) || []
    )
      .reverse() // if there are duplicate languages the latest should be kept
      .filter(
        (track, index, arr) =>
          arr.findIndex(
            (comparisonTrack) => track.language === comparisonTrack.language
          ) === index
      );
  }

  seekToLive() {
    this.currentTime = this.hls.liveSyncPosition;
  }

  destroy() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    super.destroy();
  }
}
