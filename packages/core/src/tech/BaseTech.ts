import { PlayerEvent } from "../util/constants";
import EventEmitter from "../util/EventEmitter";

export interface IBaseTechOptions {
  video: HTMLVideoElement;
  src: string;
}

export interface IWebPlayerTech {
  isPlaying: boolean;
  isMuted: boolean;

  load: (src: string) => Promise<void>;
}

export default class BaseTech extends EventEmitter implements IWebPlayerTech {
  protected video: HTMLVideoElement;

  constructor({ video }) {
    super();
    this.video = video;

    this.video.addEventListener(
      "play",
      (this.onPlay = this.onPlay.bind(this))
    );
    this.video.addEventListener(
      "pause",
      (this.onPause = this.onPause.bind(this))
    );
    this.video.addEventListener(
      "timeupdate",
      (this.onTimeUpdate = this.onTimeUpdate.bind(this))
    );
  }

  private onPlay() {
    this.emit(PlayerEvent.PLAY);
  }

  private onPause() {
    this.emit(PlayerEvent.PAUSE);
  }


  private onTimeUpdate() {
    this.emit(PlayerEvent.TIME_UPDATE, {
      currentTime: this.currentTime,
      duration: this.duration
    });
  }

  get isPlaying(): boolean {
    return !this.video.paused;
  }

  get isMuted(): boolean {
    return this.video.muted;
  }

  get isLive(): boolean {
    return this.video.duration === Infinity;
  }

  get duration(): number {
    if (!this.isLive) {
      return this.video.duration;
    }
    return NaN;
  }

  get currentTime(): number {
    if (this.isLive) {
      return Infinity;
    }
    return this.video.currentTime;
  }

  set currentTime(newpos) {
    if (!this.isLive) {
      this.video.currentTime = newpos;
    }
  }

  play(): Promise<boolean> {
    const playPromise = this.video.play();
    if (!playPromise) {
      return Promise.resolve(true);
    }
    return playPromise.then(
      () => true,
      () => false
    );
  }

  pause() {
    this.video.pause();
  }

  mute() {
    this.video.muted = true;
  }

  unmute() {
    this.video.muted = false;
  }

  load(src): Promise<void> {
    return new Promise((resolve, reject) => {
      this.video.src = src;
      this.video.load();
      resolve();
    });
  }

  destroy() {
    this.video.removeEventListener("timeupdate", this.onTimeUpdate);
  }
}
