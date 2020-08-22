import { Player } from "shaka-player";
import { IWebPlayerOptions } from "../WebPlayer";
import BaseTech from "./BaseTech";

export default class DashPlayer extends BaseTech {
  private shakaPlayer: any;

  constructor(opts: IWebPlayerOptions) {
    super(opts);
    this.shakaPlayer = new Player(this.video);
  }

  load(src: string): Promise<void> {
    return this.shakaPlayer.load(src).catch(() => {
      // TODO error handling
    });
  }

  get isLive() {
    return this.shakaPlayer.isLive();
  }

  destroy() {
    if (this.shakaPlayer) {
      this.shakaPlayer.destroy();
    }
    super.destroy();
  }
}
