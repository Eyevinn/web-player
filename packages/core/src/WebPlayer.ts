import BaseTech, { PlaybackState, IVideoLevel } from './tech/BaseTech';
import { isSafari } from './util/browser';
import { ErrorCode, ManifestType, PlayerEvent } from './util/constants';
import { canPlayManifestType, getManifestType } from './util/contentType';
import EventEmitter from './util/EventEmitter';

export { PlayerEvent } from './util/constants';
export { IPlayerState, IVideoLevel } from './tech/BaseTech';

export interface IWebPlayerOptions {
  video: HTMLVideoElement;
}

export { PlaybackState };

export default class WebPlayer extends EventEmitter {
  private tech: BaseTech;

  public video: HTMLVideoElement;
  public currentSrc: string;

  constructor({ video }: IWebPlayerOptions) {
    super();
    this.video = video;
  }

  async load(src: string) {
    this.emit(PlayerEvent.READYING);
    this.reset();

    this.currentSrc = src;

    const manifestType = await getManifestType(src);
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
        Tech = (await import('./tech/DashJsTech')).default;//ShakaTech')).default;
        break;
      case ManifestType.MSS:
        Tech = (await import('./tech/DashJsTech')).default;
        break;
    }
    this.tech = new Tech({ video: this.video });
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

  getAudioTrack_DEV() {
    if (this.tech) {
      return this.tech.audioTrack;
    }
  }

  getAudioTracks_DEV() {
    if (this.tech) {
      console.log(`tech -> audioTracks num=${this.tech.audioTracks.length || -1}`);
      this.tech.audioTracks.map(track => console.log("TRACK_-:" + JSON.stringify(track)))
      return this.tech.audioTracks;
    }
  }


  getTextTracks_DEV() {
    if (this.tech) {
      console.log(`tech -> textTracks num=${this.tech.textTracks.length || -1}`);
      this.tech.textTracks.map(track => console.log("textTRACK_-:" + JSON.stringify(track)))
      return this.tech.textTracks;
    }
  }

  setTextTrack(id) {
    if (this.tech) {
      this.tech.textTrack = id;
    }
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