//@ts-ignore
import { Player } from 'shaka-player';
import { IWebPlayerOptions } from '../WebPlayer';
import BaseTech, { PlaybackState, IVideoLevel } from './BaseTech';

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
    console.log("....:::::..:::.::::.:::\n " + JSON.stringify(this.shakaPlayer.selectVariantsByLabel("Surround")));
    this.shakaPlayer?.getVariantTracks().map(at => console.log("MPD audioTracks: \n" + JSON.stringify(at)));
    //this.shakaPlayer?.getAudioLanguagesAndRoles().map( at => console.log("MPD audio and roles: \n" + JSON.stringify(at)));
    //this.shakaPlayer?.getAudioLanguages().map( at => console.log("MPD only audiolangs: \n" + JSON.stringify(at)));
    // this.shakaPlayer?.getTextTracks().map(at => console.log("MPD TextTracks: \n" + JSON.stringify(at)));
    //this.shakaPlayer?.getTextLanguagesAndRoles().map(at => console.log("MPD TextL&R: \n" + JSON.stringify(at)));
    return this.shakaPlayer?.getAudioLanguagesAndRoles().map((audioTrack) => ({
      id: audioTrack.language,
      label: audioTrack.label ? audioTrack.label : audioTrack.language,
      language: audioTrack.language,
      enabled: this.audioTrack === audioTrack.language,
    }))
  }

  get textTrack() {
    return this.shakaPlayer?.getTextTracks()?.find((track) => track.active)
      ?.language;
  }

  set textTrack(id) {
    if (this.shakaPlayer) {
      if (!id) {
        this.shakaPlayer.setTextTrackVisibility(false);
      } else {
        this.shakaPlayer.setTextTrackVisibility(true);
        this.shakaPlayer.selectTextLanguage(id);
      }
    }
  }

  get textTracks() {
    return this.shakaPlayer?.getTextLanguagesAndRoles()
      .filter((textTrack: any) => textTrack.kind !== 'metadata')
      .map(track => ({
        id: track.language,
        label: track.label ? track.label : track.language,
        language: track.language,
        enabled: this.textTrack === track.language,
      }));
  }

  set currentLevel(level: IVideoLevel) {
    if (this.shakaPlayer) {
      if (!level) {
        this.shakaPlayer.configure({ abr: { enabled: true } });
      } else {
        this.shakaPlayer.configure({ abr: { enabled: false } });
        const variantTrack = this.shakaPlayer
          .getVariantTracks()
          .find((track) => track.id == level.id);
        this.shakaPlayer.selectVariantTrack(variantTrack, true);
      }
    }
  }

  get currentLevel() {
    if (this.shakaPlayer) {
      const currentTrack = this.shakaPlayer
        .getVariantTracks()
        .find((track) => track.active == true);
      return {
        id: currentTrack.id,
        width: currentTrack.width,
        height: currentTrack.height,
        bitrate: currentTrack.bandwidth,
      };
    }
  }

  getVideoLevels() {
    if (this.shakaPlayer) {
      const levels: IVideoLevel[] = this.shakaPlayer
        .getVariantTracks()
        .map((track) => ({
          id: track.id,
          width: track.width,
          height: track.height,
          bitrate: track.bandwidth,
        }));
      return levels;
    }
  }

  destroy() {
    if (this.shakaPlayer) {
      this.shakaPlayer.destroy();
    }
    super.destroy();
  }
}