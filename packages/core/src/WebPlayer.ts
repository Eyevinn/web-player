import BaseTech, { PlaybackState, IVideoLevel } from './tech/BaseTech';
import { isSafari } from './util/browser';
import { ErrorCode, ManifestType, PlayerEvent } from './util/constants';
import { canPlayManifestType, getManifestType } from './util/contentType';
import EventEmitter from './util/EventEmitter';

export { PlayerEvent } from './util/constants';
export { IPlayerState, IVideoLevel } from './tech/BaseTech';

export interface IWebPlayerOptions {
  video: HTMLVideoElement;
  disablePlayerSizeLevelCap?: boolean;
  iceServers?: RTCIceServer[];
}

export { PlaybackState, canPlayManifestType, ManifestType, getManifestType };

export default class WebPlayer extends EventEmitter {
  private tech: BaseTech;
  private opts: IWebPlayerOptions;

  public video: HTMLVideoElement;
  public currentSrc?: string;
  public manifestType: ManifestType = ManifestType.UNKNOWN;

  constructor(opts: IWebPlayerOptions) {
    super();
    this.opts = opts;
    this.video = opts.video;
  }

  async load(src: string, autoplay = false) {
    this.video.muted = autoplay;
    this.video.autoplay = autoplay;
    this.video.setAttribute("playsinline", "");

    this.emit(PlayerEvent.READYING);
    this.reset();

    this.currentSrc = src;

    const manifestType = await getManifestType(src);
    this.manifestType = manifestType;
    if (manifestType === ManifestType.UNKNOWN) {
      throw { errorCode: ErrorCode.UNKNOWN_MANIFEST_TYPE };
    }
    let Tech;
    switch (manifestType) {
      case ManifestType.HLS:
        if (canPlayManifestType(ManifestType.HLS) && isSafari()) {
          Tech = BaseTech;
        } else {
          Tech = (await import('./tech/HlsJsTech')).default;
        }
        break;
      case ManifestType.DASH:
        Tech = (await import('./tech/ShakaTech')).default;
        break;
      case ManifestType.MSS:
        Tech = (await import('./tech/DashJsTech')).default;
        break;
      case ManifestType.EYEVINN_WEBRTC_CHANNEL:
        Tech = (await import('./tech/WebRTCTech')).default;
        break;
      case ManifestType.EYEVINN_WHPP_CHANNEL:
        Tech = (await import('./tech/WHPPTech')).default;
        break;
      case ManifestType.WHEP:
        Tech = (await import('./tech/WHEPTech')).default;
        break;
    }
    this.tech = new Tech(this.opts);
    this.tech.on('*', this.onEvent.bind(this));

    this.emit(PlayerEvent.READY);
    return this.tech.load(src);
  }

  private onEvent(type, data) {
    this.emit(type, data);
  }

  get isPlaying(): boolean {
    return this.tech?.isPlaying ?? false;
  }

  get isMuted(): boolean {
    return this.tech?.isMuted ?? false;
  }

  get isLive() : boolean {
    return this.tech?.isLive ?? false;
  }

  get currentTime(): number {
    return this.tech?.currentTime;
  }

  get currentLevel(): IVideoLevel {
    if (this.tech) {
      return this.tech.currentLevel;
    }
  }

  set currentLevel(level: IVideoLevel) {
    if (this.tech) {
      this.tech.currentLevel = level;
    }
  }

  getVideoLevels() {
    if (this.tech) {
      const videoLevels: IVideoLevel[] = this.tech.getVideoLevels();
      return videoLevels;
    }
  }

  play(): Promise<boolean> {
    return this.tech?.play();
  }

  pause() {
    return this.tech?.pause();
  }

  stop() {
    return this.destroy();
  }

  seekTo({
    position,
    change,
    percentage,
  }: {
    position?: number;
    change?: number;
    percentage?: number;
  }) {
    if (this.tech) {
      if (percentage) {
        position = (percentage / 100) * this.tech.duration;
      } else if (change) {
        position = this.tech.currentTime + change;
      }
      this.tech.currentTime = position;
    }
  }

  seekToLive() {
    return this.tech?.seekToLive();
  }

  setAudioTrack(id) {
    if (this.tech) {
      this.tech.audioTrack = id;
    }
  }

  setTextTrack(id) {
    if (this.tech) {
      this.tech.textTrack = id;
    }
  }

  setVolume({
    change,
    percentage
  }: {
    change?: number;
    percentage?: number
  }) {
    if (this.tech) {
      let newVolume = change ? this.tech.volume + change : percentage / 100;
      if (newVolume > 1) {
        newVolume = 1;
      }
      if (newVolume < 0) {
        newVolume = 0;
      }
      this.tech.volume = newVolume;
    }
  }

  getVolume(): number {
    return this.tech?.volume;
  }

  mute() {
    this.tech?.mute();
  }

  unmute() {
    this.tech?.unmute();
  }

  reset() {
    if (this.tech) {
      this.tech.destroy();
      this.tech = null;
      this.emit(PlayerEvent.UNREADY);
    }
  }
}
