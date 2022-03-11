import { PlayerEvent } from '../util/constants';
import EventEmitter from '../util/EventEmitter';

const LIVE_EDGE = 10; // minimum seconds from edge
const LIVE_SEEKABLE_MIN_DURATION = 300; // require 5 min to allow seeking on live content

export interface IBaseTechOptions {
  video: HTMLVideoElement;
  src: string;
}

export interface ITrack {
  id: string;
  label: string;
  language: string;
  enabled: boolean;
}

export enum PlaybackState {
  IDLE,
  LOADING,
  READY,
  PLAYING,
  PAUSED,
  SEEKING,
  BUFFERING,

  BITRATE_CHANGE,
  PLAYER_STOPPED
}

export interface IVideoLevel {
  id: any;
  width: number;
  height: number;
  bitrate: number;
}

export interface IPlayerState {
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  isLive: boolean;
  isAtLiveEdge: boolean;
  isSeekable: boolean;
  isMuted: boolean;
  audioTracks: ITrack[];
  textTracks: ITrack[];
  volume: number;
}

export function getTextTrackId(textTrack) {
  if (!textTrack) {
    return null;
  }
  return `${textTrack.id}|${textTrack.label}|${textTrack.language}`;
}

export default class BaseTech extends EventEmitter {
  public name = "BaseTech";
  protected video: HTMLVideoElement;
  protected state: IPlayerState;

  constructor({ video }: { video: HTMLVideoElement }) {
    super();

    this.state = {
      playbackState: PlaybackState.IDLE,
      currentTime: 0,
      duration: 0,
      isLive: false,
      isAtLiveEdge: false,
      isSeekable: true,
      isMuted: video.muted,
      audioTracks: [],
      textTracks: [],
      volume: video.volume,
    };

    this.video = video;

    this.video.addEventListener('play', (this.onPlay = this.onPlay.bind(this)));
    this.video.addEventListener(
      'playing',
      (this.onPlaying = this.onPlaying.bind(this))
    );
    this.video.addEventListener(
      'pause',
      (this.onPause = this.onPause.bind(this))
    );
    this.video.addEventListener(
      'timeupdate',
      (this.onTimeUpdate = this.onTimeUpdate.bind(this))
    );
    this.video.addEventListener(
      'waiting',
      (this.onWaiting = this.onWaiting.bind(this))
    );
    this.video.addEventListener(
      'seeking',
      (this.onSeeking = this.onSeeking.bind(this))
    );
    this.video.addEventListener(
      'seeked',
      (this.onSeeked = this.onSeeked.bind(this))
    );
    this.video.addEventListener(
      'canplay',
      (this.onLoadedData = this.onLoadedData.bind(this))
    );
    this.video.addEventListener(
      'volumechange',
      (this.onVolumeChange = this.onVolumeChange.bind(this))
    );
    this.video.addEventListener(
      'ended',
      (this.onEnded = this.onEnded.bind(this))
    );

    // @ts-ignore
    if (this.video.audioTracks) {
      // @ts-ignore
      this.video.audioTracks.addEventListener(
        'change',
        (this.onAudioTrackChange = this.onAudioTrackChange.bind(this))
      );
    }
  }

  protected updateState(state: Partial<IPlayerState>) {
    Object.keys(state).forEach((key) => {
      if (this.state[key] !== undefined) {
        this.state[key] = state[key];
      }
    });
    this.emit(PlayerEvent.STATE_CHANGE, { state: this.state });
  }

  protected onLoadedData() {
    this.updateState({
      playbackState: this.video.paused
        ? PlaybackState.PAUSED
        : PlaybackState.PLAYING,
      duration: this.duration,
      isLive: this.isLive,
      audioTracks: this.audioTracks,
      textTracks: this.textTracks,
    });
    this.emit(PlayerEvent.LOADED_METADATA, this.state);
  }

  protected onPlay() {
    this.updateState({ playbackState: PlaybackState.PLAYING });
    this.emit(PlayerEvent.PLAY);
  }

  protected onPause() {
    this.updateState({ playbackState: PlaybackState.PAUSED });
    this.emit(PlayerEvent.PAUSE);
  }

  protected onPlaying() {
    if (this.state.playbackState !== PlaybackState.PLAYING) {
      this.updateState({ playbackState: PlaybackState.PLAYING });
    }
    this.emit(PlayerEvent.PLAYING);
  }

  protected onTimeUpdate() {
    this.updateState({
      currentTime: this.currentTime,
      duration: this.duration,
      isAtLiveEdge: this.currentTime >= this.duration - LIVE_EDGE,
      isSeekable: this.isLive
        ? this.duration >= LIVE_SEEKABLE_MIN_DURATION
        : true,
    });
    this.emit(PlayerEvent.TIME_UPDATE, {
      currentTime: this.currentTime,
      duration: this.duration,
    });
  }

  protected onWaiting() {
    if (this.state.playbackState !== PlaybackState.SEEKING) {
      this.updateState({ playbackState: PlaybackState.BUFFERING });
      this.emit(PlayerEvent.BUFFERING);
    }
    this.emit(PlayerEvent.WAITING);
  }

  protected onSeeking() {
    this.updateState({ playbackState: PlaybackState.SEEKING });
    this.emit(PlayerEvent.SEEKING);
  }

  protected onSeeked() {
    this.updateState({
      playbackState: this.video.paused
        ? PlaybackState.PAUSED
        : PlaybackState.PLAYING,
    });
    this.emit(PlayerEvent.SEEKED);
  }

  protected onVolumeChange() {
    const fields: { [s: string]: number | boolean | string } = {
      volume: this.video.volume,
    };
    if (this.state.isMuted !== this.isMuted) {
      fields.isMuted = this.isMuted;
    }

    this.updateState(fields);
    this.emit(PlayerEvent.VOLUME_CHANGE, { volume: this.video.volume });
  }

  protected onAudioTrackChange() {
    this.updateState({ audioTracks: this.audioTracks });
    this.emit(PlayerEvent.AUDIO_TRACK_CHANGE);
  }

  protected onTextTrackChange() {
    this.updateState({ textTracks: this.textTracks });
    this.emit(PlayerEvent.TEXT_TRACK_CHANGE);
  }

  protected onEnded() {
    this.emit(PlayerEvent.ENDED);
    this.updateState({
      playbackState: PlaybackState.IDLE,
    });
  }

  protected onBitrateChange() {
    // Base tech does not do quality levels.
  }

  set currentLevel(level: IVideoLevel) {
    // Base tech does not do quality levels.
  }

  get currentLevel() {
    let level: IVideoLevel;
    return level;
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
    if (this.isLive && this.video.seekable.length) {
      return this.video.seekable.end(0);
    }
    return this.video.duration || 0;
  }

  get currentTime(): number {
    return this.video.currentTime;
  }

  set currentTime(newpos: number) {
    if (this.state.isSeekable) {
      this.video.currentTime = this.isLive
        ? Math.min(newpos, this.duration - LIVE_EDGE)
        : newpos;
    }
  }

  get audioTrack() {
    const audioTrack = this.audioTracks.find(
      (audioTrack) => audioTrack.enabled
    );
    return audioTrack?.id;
  }

  set audioTrack(id) {
    // @ts-ignore
    if (this.video.audioTracks) {
      // @ts-ignore
      for (const audioTrack of this.video.audioTracks || []) {
        audioTrack.enabled = audioTrack.id === id;
      }
    }
  }

  get audioTracks(): ITrack[] {
    return (
      // @ts-ignore
      Array.from(this.video.audioTracks ?? []).map((audioTrack: any) => ({
        id: audioTrack.id,
        label: audioTrack.label,
        language: audioTrack.language,
        enabled: audioTrack.enabled,
      }))
    );
  }

  get textTrack() {
    const textTrack = this.textTracks.find((textTrack) => textTrack.enabled);
    return getTextTrackId(textTrack);
  }

  set textTrack(id) {
    // @ts-ignore
    if (this.video.textTracks) {
      // @ts-ignore
      for (const textTrack of this.video.textTracks || []) {
        textTrack.enabled = getTextTrackId(textTrack) === id;
      }
    }
  }

  get textTracks(): ITrack[] {
    return (
      // @ts-ignore
      Array.from(this.video.textTracks ?? [])
        .filter((textTrack: any) => textTrack.kind !== 'metadata')
        .map((textTrack: any) => ({
          id: getTextTrackId(textTrack),
          label: textTrack.label,
          language: textTrack.language,
          enabled: textTrack.enabled,
        }))
    );
  }

  get volume(): number {
    return this.video.volume;
  }
  set volume(newvol: number) {
    this.video.volume = Number(newvol.toFixed(2));
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

  load(src: string): Promise<void> {
    this.setDefaultState();
    return new Promise((resolve, reject) => {
      this.video.src = src;
      this.video.load();

      resolve();
    });
  }

  setDefaultState() {
    this.updateState({
      playbackState: PlaybackState.LOADING,
      currentTime: 0,
      duration: 0,
      isLive: false,
      isAtLiveEdge: false,
      isSeekable: true,
      isMuted: this.video.muted,
      audioTracks: [],
      textTracks: [],
      volume: this.video.volume
    });
  }

  stop() {
    this.video.src = '';
    this.video.load();
    this.updateState({
      playbackState: PlaybackState.IDLE,
      isLive: false,
      currentTime: this.currentTime,
      duration: this.duration,
    });
    this.emit(PlayerEvent.PLAYER_STOPPED);
  }

  seekToLive() {
    this.currentTime = this.duration - LIVE_EDGE;
  }

  getVideoLevels() {
    let videoLevels: IVideoLevel[] = [];
    return videoLevels;
  }

  destroy() {
    this.stop();
    this.video.removeEventListener('timeupdate', this.onTimeUpdate);
  }
}
