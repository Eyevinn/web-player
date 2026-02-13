//@ts-ignore
import shaka from 'shaka-player';
import { IWebPlayerOptions } from '../WebPlayer';
import BaseTech, { IVideoLevel, ITrack, getTextTrackId } from './BaseTech';
import { PlayerEvent } from '../util/constants';

export default class DashPlayer extends BaseTech {
  public name = "ShakaTech";
  private shakaPlayer: any;

  constructor(opts: IWebPlayerOptions) {
    super(opts);
    shaka.polyfill.installAll();
    this.shakaPlayer = new shaka.Player(this.video);

    const restrictToElementSize = !opts.disablePlayerSizeLevelCap;
    this.shakaPlayer.configure({ abr: { restrictToElementSize: restrictToElementSize } });
    this.shakaPlayer.addEventListener(
      'variantchanged',
      (this.onAudioTrackChange = this.onAudioTrackChange.bind(this))
    );
    this.shakaPlayer.addEventListener('adaptation', () => {
      this.onBitrateChange();
    });
    this.shakaPlayer.addEventListener(
      'error',
      (this.onError = this.onError.bind(this))
    );
  }

  load(src: string): Promise<void> {
    super.setDefaultState();
    return this.shakaPlayer.load(src).catch(() => {
      // TODO error handling
    });
  }

  protected onBitrateChange() {
    const activeTracks = this.shakaPlayer
      .getVariantTracks()
      .filter((track) => track.active);
    const bitrate = activeTracks.reduce(
      (btr, track) => btr + track.bandwidth,
      0
    );
    const videoTrack = activeTracks.find((track) => track.type === 'variant');

    this.emit(PlayerEvent.BITRATE_CHANGE, {
      bitrate,
      width: videoTrack.width,
      height: videoTrack.height,
    });
  }

  protected onError(data) {
    const errorDetails = data?.detail;
    console.log(errorDetails);
    const fatal = errorDetails.severity > 1 ? true : false;

    let errorData = {
      category: errorDetails.category.toString(),
      code: errorDetails.code.toString(),
      message: errorDetails.data[1].toString(),
      data: errorDetails.data
    };
    this.emit(PlayerEvent.ERROR, { errorData, fatal });
  }

  get isLive() {
    return this.shakaPlayer.isLive();
  }

  get duration(): number {
    const { start, end } = this.shakaPlayer.seekRange();
    return end - start || 0;
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

  get textTrack() {
    const track = this.shakaPlayer
      .getTextTracks()
      .find((track) => track.active);
    if (track && this.shakaPlayer.isTextTrackVisible()) {
      return getTextTrackId(track);
    }
    return null;
  }

  set textTrack(trackId) {
    if (trackId) {
      this.shakaPlayer.setTextTrackVisibility(true);
      const internalTrack = this.shakaPlayer
        .getTextTracks()
        .find((t) => getTextTrackId(t) === trackId);
      this.shakaPlayer.selectTextTrack(internalTrack);
    } else {
      this.shakaPlayer.setTextTrackVisibility(false);
    }
  }

  get textTracks(): ITrack[] {
    return this.shakaPlayer
      .getTextTracks()
      .map((track) =>  {
        return {
          id: track.id,
          label: track.label,
          language: track.language,
          enabled: this.textTrack === getTextTrackId(track),
        }
      })
      .filter(
        (track, index, array) =>
          array.findIndex(
            (compTrack) =>
              track.language === compTrack.language &&
              track.label === compTrack.label
          ) === index
      );
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
