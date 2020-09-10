import { MediaPlayer, MediaPlayerClass } from "dashjs";
import BaseTech, {IBaseTechOptions} from "./BaseTech";

export default class MssPlayer extends BaseTech {
  private mediaPlayer: MediaPlayerClass;

  constructor(opts: IBaseTechOptions) {
    super(opts);
    this.mediaPlayer = MediaPlayer().create()
    this.mediaPlayer.initialize();
    this.mediaPlayer.attachView(this.video);
  }

  load(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.mediaPlayer.attachSource(src);
      this.mediaPlayer.on(MediaPlayer.events.MANIFEST_LOADED, () => {
        resolve();
      });
      this.mediaPlayer.on(MediaPlayer.events.ERROR, ev => {
        reject(`Failed to load Mss Player: ${ev.error.message}`);
      });
    });
  }

  get isLive() {
    return this.mediaPlayer.isDynamic();
  }

  destroy() {
    if (this.mediaPlayer) {
      this.mediaPlayer.reset();
      this.mediaPlayer = null;
    }
    super.destroy();
  }
}
