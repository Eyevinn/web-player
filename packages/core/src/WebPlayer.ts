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
        Tech = (await import('./tech/ShakaTech')).default;
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

  volChange(change) {
    //TEMPORARY SOLUTION! CAN'T SET VOLUME TO ZERO WITH SLIDER USING THIS METHOD
    if (change > 1) {
      this.tech.volume = change/100
      console.log("Percentual" + change)
    }
    else if (change > 0 && this.tech.volume < 1) {
        this.tech.volume = (this.tech.volume + change).toFixed(2);
    }
    else if (change < 0 && this.tech.volume > 0) {
      this.tech.volume = (this.tech.volume + change).toFixed(2);
    }

    if (this.tech.volume === 0) {
      this.mute();
      //console.log(this.isMuted)
    }

    else {
      this.unmute();
      //console.log(this.isMuted)
    }
    //console.log(this.tech.volume)
    //DON'T EMIT HERE! Gives a lot of "undefined". Emit in BaseTech.
    //this.emit(PlayerEvent.VOLUME_CHANGE, this.tech.volume);
    
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