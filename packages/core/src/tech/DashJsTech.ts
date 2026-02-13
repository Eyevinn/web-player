import { MediaPlayer, MediaPlayerClass } from 'dashjs';
import BaseTech, { IBaseTechOptions, PlaybackState } from './BaseTech';
import { PlayerEvent } from '../util/constants';
import { formatDashError } from '../util/errors';

export default class MssPlayer extends BaseTech {
  private mediaPlayer: MediaPlayerClass;

  constructor(opts: IBaseTechOptions) {
    super(opts);
    this.mediaPlayer = MediaPlayer().create();
    this.mediaPlayer.initialize();
    this.mediaPlayer.attachView(this.video);
  }

  load(src: string): Promise<void> {
    super.setDefaultState();
    return new Promise((resolve, reject) => {
      this.mediaPlayer.attachSource(src);
      this.mediaPlayer.on(MediaPlayer.events.MANIFEST_LOADED, () => {
        resolve();
      });
      this.mediaPlayer.on(MediaPlayer.events.ERROR, (ev) => {
        this.emit(PlayerEvent.ERROR, formatDashError(ev));
        reject(`Failed to load Mss Player`);
      });
    });
  }

  get isLive() {
    return this.mediaPlayer.isDynamic();
  }

  destroy() {
    super.destroy();
    if (this.mediaPlayer) {
      this.mediaPlayer.reset();
      this.mediaPlayer = null;
    }
  }
}
