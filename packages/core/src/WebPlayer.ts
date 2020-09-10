import BaseTech, { PlaybackState } from "./tech/BaseTech";
import { ErrorCode, ManifestType } from "./util/constants";
import { getManifestType } from "./util/contentType";
import EventEmitter from "./util/EventEmitter";

export { PlayerEvent } from './util/constants';

export interface IWebPlayerOptions {
  video: HTMLVideoElement;
}

export { PlaybackState };

export default class WebPlayer extends EventEmitter {
  private tech: BaseTech;
  private video: HTMLVideoElement;

  constructor({ video }: IWebPlayerOptions) {
    super();
    this.video = video;
  }

  async load(src: string) {
    this.reset();

    const manifestType = await getManifestType(src);
    if (manifestType === ManifestType.UNKNOWN) {
      throw { errorCode: ErrorCode.UNKNOWN_MANIFEST_TYPE };
    }
    let Tech;
    switch (manifestType) {
      case ManifestType.HLS:
        Tech = (await import("./tech/HlsJsTech")).default;
        break;
      case ManifestType.DASH:
	Tech = (await import("./tech/ShakaTech")).default;
        break;
      case ManifestType.MSS:
        Tech = (await import("./tech/DashJsTech")).default;
        break;
    }
    this.tech = new Tech({ video: this.video });
    this.tech.on('*', this.onEvent.bind(this));

    return this.tech.load(src);
  }

  private onEvent(type, data) {
    this.emit(type, data);
  }

  get isPlaying(): boolean {
    return this.tech?.isPlaying ?? false;
  }

  play(): Promise<boolean> {
    return this.tech?.play();
  }
  
  pause() {
    return this.tech?.pause();
  }

  reset() {
    if (this.tech) {
      this.tech.destroy();
      this.tech = null;
    }
  }
}
