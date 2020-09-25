import { PlayerEvent } from '../util/constants';
import EventEmitter from '../util/EventEmitter';

export interface IBaseTechOptions {
  video: HTMLVideoElement;
  src: string;
}

export interface IAudioTrack {
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
}

export interface IPlayerState {
  prevPlaybackState: PlaybackState;
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  isLive: boolean;
  isMuted: boolean;
  audioTracks: IAudioTrack[];
}

export default class BaseTech extends EventEmitter {
  protected video: HTMLVideoElement;
  protected state: IPlayerState;

  constructor({ video }: { video: HTMLVideoElement }) {
    super();

    this.state = {
      prevPlaybackState: PlaybackState.IDLE,
      playbackState: PlaybackState.IDLE,
      currentTime: 0,
      duration: 0,
      isLive: false,
      isMuted: video.muted,
      audioTracks: [],
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
      'loadeddata',
      (this.onLoadedData = this.onLoadedData.bind(this))
    );
    this.video.addEventListener(
      'volumechange',
      (this.onVolumeChange = this.onVolumeChange.bind(this))
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

  protected updateState(state: any) {
    Object.keys(state).forEach((key) => {
      if (this.state[key] !== undefined) {
        if (key === 'playbackState') {
          this.state['prevPlaybackState'] = this.state.playbackState;
        }
        this.state[key] = state[key];
      }
    });
    this.emit(PlayerEvent.STATE_CHANGE, { state: this.state });
  }

  protected onLoadedData() {
    this.updateState({
      duration: this.duration,
      isLive: this.isLive,
      audioTracks: this.audioTracks,
    });
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
    this.updateState({ playbackState: this.state.prevPlaybackState });
    this.emit(PlayerEvent.SEEKED);
  }

  protected onVolumeChange() {
    if (this.state.isMuted !== this.isMuted) {
      this.updateState({ isMuted: this.isMuted });
    }
    this.emit(PlayerEvent.VOLUME_CHANGE, { volume: this.video.volume });
  }

  protected onAudioTrackChange() {
    this.updateState({ audioTracks: this.audioTracks });
    this.emit(PlayerEvent.AUDIO_TRACK_CHANGE);
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
    return this.video.duration || 0;
  }

  get currentTime(): number {
    return this.video.currentTime;
  }

  set currentTime(newpos) {
    this.video.currentTime = newpos;
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
      for (const audioTrack of (this.video.audioTracks || [])) {
        audioTrack.enabled = audioTrack.id === id;
      }
    }
  }

  get audioTracks(): IAudioTrack[] {
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

  stop() {
    this.video.src = '';
    this.video.load();
    this.updateState({
      playbackState: PlaybackState.IDLE,
      isLive: false,
      currentTime: this.currentTime,
      duration: this.duration,
    });
  }

  destroy() {
    this.stop();
    this.video.removeEventListener('timeupdate', this.onTimeUpdate);
  }
}
