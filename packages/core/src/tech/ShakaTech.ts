import { Player } from 'shaka-player';
import { IWebPlayerOptions } from '../WebPlayer';
import BaseTech, { PlaybackState } from './BaseTech';

export default class DashPlayer extends BaseTech {
  private shakaPlayer: any;

  constructor(opts: IWebPlayerOptions) {
    super(opts);
    this.shakaPlayer = new Player(this.video);
    this.shakaPlayer.addEventListener(
      'variantchanged',
      (this.onAudioTrackChange = this.onAudioTrackChange.bind(this))
    );
  }

  load(src: string): Promise<void> {
    this.updateState({
      playbackState: PlaybackState.LOADING,
    });
    return this.shakaPlayer.load(src).catch(() => {
      // TODO error handling
    });
  }

  get isLive() {
    return this.shakaPlayer.isLive();
  }

  get audioTrack() {
    return this.shakaPlayer?.getVariantTracks()?.find((track) => track.active)
      ?.language;
  }

  set audioTrack(id) {
    if (this.shakaPlayer) {
      this.shakaPlayer.selectAudioLanguage(id);
    }
  }

  get audioTracks() {
    return this.shakaPlayer?.getAudioLanguages().map((audioLang) => ({
      id: audioLang,
      language: audioLang,
      label: audioLang,
      enabled: this.audioTrack === audioLang,
    }));
  }

  destroy() {
    if (this.shakaPlayer) {
      this.shakaPlayer.destroy();
    }
    super.destroy();
  }
}