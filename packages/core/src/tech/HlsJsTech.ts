import BaseTech, {
  IBaseTechOptions,
  IVideoLevel,
  PlaybackState,
} from './BaseTech';
import Hls from 'hls.js';
import { PlayerEvent } from '../util/constants';

const DEFAULT_CONFIG = {
  capLevelOnFPSDrop: true,
  capLevelToPlayerSize: true,
};

const LIVE_EDGE = 5; // seconds from liveEdge
const LIVE_SEEKABLE_MIN_DURATION = 300; // require 5 min to allow seeking on live content

export default class HlsJsTech extends BaseTech {
  static isSupported() {
    return Hls.isSupported();
  }

  private hls: Hls;

  private isLiveFlag: boolean;
  private playlistDuration = 0;

  constructor(opts: IBaseTechOptions) {
    super(opts);
    this.hls = new Hls(DEFAULT_CONFIG);

    this.hls.attachMedia(this.video);

    this.hls.on(
      Hls.Events.AUDIO_TRACK_SWITCHED,
      this.onAudioTrackChange.bind(this)
    );

    this.hls.on(
      Hls.Events.SUBTITLE_TRACK_SWITCH,
      this.onTextTrackChange.bind(this)
    );

    this.hls.on(Hls.Events.LEVEL_LOADED, this.onLevelLoaded.bind(this));
  }

  load(src: string): Promise<void> {
    if (this.state.playbackState !== PlaybackState.IDLE) {
      this.stop();
    }
    this.updateState({
      playbackState: PlaybackState.LOADING,
    });
    return new Promise((resolve) => {
      this.hls.loadSource(src);
      this.hls.once(Hls.Events.MANIFEST_PARSED, () => {
        resolve();
      });
    });
  }

  protected onTimeUpdate() {
    this.updateState({
      currentTime: this.currentTime,
      duration: this.duration,
      isAtLiveEdge: this.currentTime >= this.hls.liveSyncPosition - LIVE_EDGE,
      isSeekable: this.isLive
        ? this.playlistDuration >= LIVE_SEEKABLE_MIN_DURATION
        : true,
    });
    this.emit(PlayerEvent.TIME_UPDATE, {
      currentTime: this.currentTime,
      duration: this.duration,
    });
  }

  private onLevelLoaded(event, data) {
    const isLive = data?.details?.live;
    if (this.isLiveFlag !== isLive) {
      this.isLiveFlag = isLive;
      this.updateState({
        isLive,
      });
    }

    this.playlistDuration = data?.details?.totalduration;
  }

  getVideoLevels() {
    if (this.hls) {
      const levels: IVideoLevel[] = this.hls.levels.map((level, idx) => ({
        id: idx,
        width: level.width,
        height: level.height,
        bitrate: level.bitrate,
      }));
      return levels;
    }
  }

  get currentLevel() {
    let videoLevel: IVideoLevel;
    if (this.hls) {
      videoLevel = this.getVideoLevels().find(
        (level) => level.id === this.hls.currentLevel
      );
      return videoLevel;
    }
  }

  set currentLevel(level: IVideoLevel) {
    if (this.hls) {
      if (!level) {
        this.hls.nextLevel = -1;
      } else {
        this.hls.currentLevel = level.id;
      }
    }
  }

  get currentTime() {
    return this.video.currentTime;
  }

  set currentTime(newpos: number) {
    if (this.state.isSeekable) {
      this.video.currentTime = this.isLive
        ? Math.min(newpos, this.hls.liveSyncPosition ?? newpos)
        : newpos;
    }
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
  }

  get textTrack() {
    return this.hls?.subtitleTrack?.toString();
  }

  set textTrack(id) {
    if (this.hls) {
      if (!id) {
        this.hls.subtitleTrack = -1;
      } else {
        this.hls.subtitleTrack = parseInt(id);
      }

    }
  }

  get textTracks() {
    return (
      this.hls?.subtitleTracks.map(textTrack => ({
        id: textTrack.id.toString(),
        label: textTrack.name,
        language: textTrack.lang,
        enabled: this.textTrack === textTrack.id.toString(),
      })) || []
    )
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