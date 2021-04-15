import { Player } from 'shaka-player';
import { IWebPlayerOptions } from '../WebPlayer';
import BaseTech, { PlaybackState, IVideoQuality } from './BaseTech';

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

  set currentLevel(level: number) {
    // Base tech does not do levels.
    if (this.shakaPlayer) {
      if (level == -1) {
        this.shakaPlayer.configure({ abr: { enabled: true } });
      } else {
        this.shakaPlayer.configure({ abr: { enabled: false } });
        const variantTrack = this.shakaPlayer
          .getVariantTracks()
          .find((track) => track.id == level);
        this.shakaPlayer.selectVariantTrack(variantTrack, true);
      }
    }
  }

  get currentLevel() {
    if (this.shakaPlayer) {
      const currentTrack = this.shakaPlayer
        .getVariantTracks()
        .find((track) => track.active == true);
      return currentTrack.id;
    }
    return -1;
  }

  getVideoQualities() {
    if (this.shakaPlayer) {
      const videoQualities: IVideoQuality[] = [];
      const tracks = this.shakaPlayer.getVariantTracks();
      tracks.forEach((track) => {
        const quality: IVideoQuality = {
          width: track.width,
          height: track.height,
          bitrate: track.bandwidth,
        };
        videoQualities.push(quality);
      });
      return videoQualities;
    }
  }

  destroy() {
    if (this.shakaPlayer) {
      this.shakaPlayer.destroy();
    }
    super.destroy();
  }
}
