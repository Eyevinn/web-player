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
  public name = "HlsJsTech";
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

    this.hls.on(
      Hls.Events.LEVEL_SWITCHED,
      this.onBitrateChange.bind(this)
    );
    this.hls.on(
      Hls.Events.ERROR,
      this.onErrorEvent.bind(this)
    );
  }

  load(src: string): Promise<void> {
    if (this.state.playbackState !== PlaybackState.IDLE) {
      this.stop();
    }
    this.updateState({
      playbackState: PlaybackState.LOADING,
      currentTime: 0,
      duration: 0,
      isLive: false,
      isAtLiveEdge: false,
      isSeekable: true,
      isMuted: this.video.muted,
      audioTracks: [],
      textTracks: [],
    });
    return new Promise((resolve) => {
      this.hls.loadSource(src);
      this.hls.once(Hls.Events.MANIFEST_PARSED, () => {
        this.removeUnsupportedLevels();
        resolve();
      });
    });
  }

  /**
   * filter out any level not supported by hls.js
   * recursive method that looks for a level and then removes it if unsupported, due to how
   * hls.js is built we cannot remove all unsupported levels in one go because the underlying
   * array changes.
   */
  private removeUnsupportedLevels() {
    const unsupportedLevelIndex = this.hls.levels.findIndex((level) => {
      return !MediaSource.isTypeSupported(`video/mp4; codecs="${level.attrs.CODECS}"`);
    });
    if (unsupportedLevelIndex !== -1) {
        this.hls.removeLevel(unsupportedLevelIndex);
        this.removeUnsupportedLevels();
    }
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

  protected onBitrateChange() {
    this.emit(PlayerEvent.BITRATE_CHANGE, this.currentLevel);
  }

  protected onErrorEvent(event, data) {
    const fatal = data?.fatal;
    const errorData = this.errorFormat(data);

    this.emit(PlayerEvent.ERROR, { errorData, fatal });
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

  errorFormat(data) {
    let errorData = {
      category: data?.type, // optional, eg. NETWORK, DECODER, etc.
      code: "-1",
      message: "", // optional
      data: data, // optional
    }
    const errorDetails = data?.details;
    switch (errorDetails) {
      //All Fatal
      case Hls.ErrorDetails.MANIFEST_LOAD_ERROR:
      case Hls.ErrorDetails.LEVEL_LOAD_ERROR:
      case Hls.ErrorDetails.FRAG_LOAD_ERROR: //fatal = true || false
          errorData.code = `${data.response.code}`,
          errorData.message = data.response.text
        break;
      case Hls.ErrorDetails.MANIFEST_PARSING_ERROR:
          errorData.message = data.reason
        break;
      case Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT:
      case Hls.ErrorDetails.FRAG_LOAD_TIMEOUT: //fatal = true || false
      case Hls.ErrorDetails.KEY_LOAD_TIMEOUT:
        break;
      //Non Fatal
      case Hls.ErrorDetails.AUDIO_TRACK_LOAD_ERROR:
      case Hls.ErrorDetails.KEY_LOAD_ERROR:
          errorData.code = `${data.response.code}`,
          errorData.message = data.response.text
      break;
      case Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT:
      case Hls.ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT:
      default:
    }

    return errorData;
  }

  destroy() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    super.destroy();
  }
}
